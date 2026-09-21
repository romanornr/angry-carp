//! Bounded offline experiment, not the product's storage API or command interface.

mod storage;

use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Child, Command, Output, Stdio};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::mpsc;
use std::time::Duration;

const ORIGINAL: &[u8] = b"From: sender@example.invalid\r\nSubject: SYNTHETIC\r\nX-Folded: one\r\n two\r\n\r\nOriginal bytes: \x00\xff\x80\r\n";
const DRAFT: &[u8] = b"SYNTHETIC AWS report awaiting review. No delivery.\r\n";

static NEXT_DIRECTORY: AtomicUsize = AtomicUsize::new(0);

struct Workspace {
    directory: PathBuf,
    database: PathBuf,
}

impl Workspace {
    fn new() -> Self {
        let sequence = NEXT_DIRECTORY.fetch_add(1, Ordering::Relaxed);
        let directory = std::env::temp_dir().join(format!(
            "angry-carp-synthetic-{}-{sequence}",
            std::process::id()
        ));
        fs::create_dir(&directory).expect("create fresh synthetic workspace");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&directory, fs::Permissions::from_mode(0o700)).unwrap();
        }
        let workspace = Self {
            database: directory.join("cases.sqlite3"),
            directory,
        };
        workspace.sql(include_str!("schema.sql"));
        workspace
    }

    fn command(&self, action: &str) -> Command {
        let mut command = Command::new(std::env::current_exe().unwrap());
        command
            .arg("--worker")
            .arg(&self.database)
            .arg(action)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        command
    }

    fn request(&self, action: &str, payload: &str) -> Output {
        let mut child = self.command(action).spawn().expect("Rust worker process");
        writeln!(
            child.stdin.take().unwrap(),
            "{}",
            serde_json::to_string(payload).unwrap()
        )
        .unwrap();
        child.wait_with_output().unwrap()
    }

    fn output(&self, sql: &str) -> Output {
        if let Some(payload) = sql.strip_prefix("IMPORT\n") {
            return self.request("import", payload);
        }
        let action = if sql.starts_with("SELECT") || sql.starts_with("PRAGMA integrity") {
            "query"
        } else {
            "execute"
        };
        self.request(action, sql)
    }

    fn sql(&self, sql: &str) -> String {
        let output = self.output(sql);
        assert!(
            output.status.success(),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        String::from_utf8(output.stdout)
            .unwrap()
            .trim_end()
            .to_owned()
    }

    fn snapshot(&self) -> String {
        {
            let result = self.request("snapshot", "");
            assert!(
                result.status.success(),
                "{}",
                String::from_utf8_lossy(&result.stderr)
            );
            String::from_utf8(result.stdout).unwrap()
        }
    }

    fn reserved_writer(&self, updates: &str) -> Writer {
        let mut child = self.command("hold").spawn().unwrap();
        writeln!(
            child.stdin.as_mut().unwrap(),
            "{}",
            serde_json::to_string(updates).unwrap()
        )
        .unwrap();
        child.stdin.as_mut().unwrap().flush().unwrap();
        let stdout = child.stdout.take().unwrap();
        let (sender, receiver) = mpsc::channel();
        let reader = std::thread::spawn(move || {
            let mut line = String::new();
            BufReader::new(stdout).read_line(&mut line).unwrap();
            let _ = sender.send(line);
        });
        let writer = Writer(child);
        assert_eq!(
            receiver.recv_timeout(Duration::from_secs(5)).unwrap(),
            "ready\n"
        );
        reader.join().unwrap();
        writer
    }
}

impl Drop for Workspace {
    fn drop(&mut self) {
        fs::remove_dir_all(&self.directory).expect("remove this experiment's temporary data");
    }
}

struct Writer(Child);

impl Drop for Writer {
    fn drop(&mut self) {
        self.0.kill().unwrap();
        self.0.wait().unwrap();
    }
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02X}")).collect()
}

fn import_sql(id: &str, original: &[u8], sufficient: bool) -> String {
    format!(
        "IMPORT\n{}",
        serde_json::to_string(&(id, original, sufficient)).unwrap()
    )
}

fn seed() -> Workspace {
    let workspace = Workspace::new();
    workspace.sql(&import_sql("case-1", ORIGINAL, true));
    workspace
}

fn restart_recovers_original_and_reports() {
    let workspace = seed();
    assert_eq!(
        workspace.sql("SELECT hex(content) FROM originals;"),
        hex(ORIGINAL)
    );
    assert_eq!(
        workspace.sql("SELECT digest, method FROM originals;"),
        "81b5bbbaf5071d443d55d403b149f4fd293ac77b709c2cbe05c3329c8e108154|synthetic-file-fixture"
    );
    assert_eq!(workspace.sql("SELECT revision FROM cases;"), "2");
    assert_eq!(
        workspace
            .sql("SELECT provider,status,coalesce(receipt,'none') FROM reports ORDER BY provider;"),
        "AWS|awaiting_approval|none\nSynthetic registrar|confirmed_submitted|SYNTHETIC-PRIOR-RECEIPT-001"
    );
    assert_eq!(
        workspace.sql("SELECT hex(payload) FROM reports WHERE provider='AWS';"),
        hex(DRAFT)
    );
    assert_eq!(
        workspace.sql(
            "SELECT position,(SELECT integrity_check FROM pragma_integrity_check) FROM checkpoints;"
        ),
        "message-1|ok"
    );
}

fn repeated_import_keeps_progress() {
    let workspace = seed();
    workspace.sql(
        "UPDATE reports SET reason='Reviewed but awaiting operator decision' WHERE provider='AWS';
                   UPDATE checkpoints SET position='message-2';",
    );
    let before = workspace.snapshot();
    workspace.sql(&import_sql("case-1", ORIGINAL, true));
    workspace.sql(&import_sql("case-1", ORIGINAL, true));
    assert_eq!(workspace.snapshot(), before);
    assert_eq!(
        workspace.sql("SELECT (SELECT count(*) FROM originals),(SELECT count(*) FROM reports);"),
        "1|2"
    );
}

fn conflicting_original_is_rejected() {
    let workspace = seed();
    let result = workspace.output(&import_sql("case-1", b"Replacement bytes", true));
    assert!(!result.status.success());
    assert!(String::from_utf8_lossy(&result.stderr).contains("conflicting original import"));
    assert_eq!(
        workspace.sql("SELECT hex(content) FROM originals;"),
        hex(ORIGINAL)
    );
    let update = workspace.output("UPDATE originals SET content=X'00';");
    assert!(!update.status.success());
    assert!(String::from_utf8_lossy(&update.stderr).contains("original is immutable"));
}

fn crash_rolls_back_provider_and_checkpoint() {
    let workspace = seed();
    let before = workspace.snapshot();
    let writer = workspace.reserved_writer(
        "
UPDATE reports SET status='held', reason='uncommitted' WHERE provider='AWS';
UPDATE checkpoints SET position='uncommitted-position';
PRAGMA cache_size=1;
CREATE TABLE interrupted_pages(content BLOB);
WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x<32)
 INSERT INTO interrupted_pages SELECT zeroblob(8192) FROM n;",
    );
    drop(writer);
    assert!(
        workspace
            .database
            .with_extension("sqlite3-journal")
            .exists()
    );
    assert_eq!(workspace.snapshot(), before);
    assert_eq!(workspace.sql("PRAGMA integrity_check;"), "ok");
    workspace.sql(&import_sql("case-1", ORIGINAL, true));
    assert_eq!(workspace.snapshot(), before);
}

fn competing_writer_is_rejected() {
    let workspace = seed();
    let writer = workspace.reserved_writer("");
    let result = workspace.output(&import_sql("case-2", ORIGINAL, true));
    assert!(!result.status.success());
    assert!(String::from_utf8_lossy(&result.stderr).contains("database is locked"));
    drop(writer);
    assert_eq!(workspace.sql("SELECT count(*) FROM cases;"), "1");
    workspace.sql(&import_sql("case-2", ORIGINAL, true));
    assert_eq!(workspace.sql("SELECT count(*) FROM cases;"), "2");
}

fn inactive_resource_and_evidence_are_separate() {
    let workspace = seed();
    workspace.sql(&import_sql(
        "case-weak",
        b"SYNTHETIC incomplete clues\r\n",
        false,
    ));
    assert_eq!(
        workspace.sql("SELECT resource_status FROM observations ORDER BY case_id;"),
        "apparently_inactive\napparently_inactive"
    );
    assert_eq!(workspace.sql("SELECT case_id,status,payload IS NULL FROM reports WHERE provider='AWS' ORDER BY case_id;"),
               "case-1|awaiting_approval|0\ncase-weak|held|1");
    assert_eq!(
        workspace.sql("SELECT reason FROM reports WHERE case_id='case-weak' AND provider='AWS';"),
        "An unavailable resource alone does not support an abuse claim."
    );
}

fn backup_recovers_pending_work() {
    let workspace = seed();
    let backup = workspace.directory.join("backup.sqlite3");
    let result = workspace.request("backup", backup.to_str().unwrap());
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
    let original_snapshot = workspace.snapshot();
    fs::rename(backup, &workspace.database).unwrap();
    assert_eq!(workspace.snapshot(), original_snapshot);
    assert_eq!(
        workspace.sql("SELECT status,(SELECT integrity_check FROM pragma_integrity_check) FROM reports WHERE provider='AWS';"),
        "awaiting_approval|ok"
    );
}

fn worker(path: &str, action: &str) -> Result<(), Box<dyn std::error::Error>> {
    let mut line = String::new();
    std::io::stdin().read_line(&mut line)?;
    let payload: String = serde_json::from_str(&line)?;
    let mut connection = storage::open(path)?;
    match action {
        "execute" => connection.execute_batch(&payload)?,
        "query" => println!("{}", storage::query(&connection, &payload)?),
        "snapshot" => println!("{}", storage::snapshot(&mut connection)?),
        "import" => {
            let (id, original, sufficient): (String, Vec<u8>, bool) =
                serde_json::from_str(&payload)?;
            storage::import(&mut connection, &id, &original, sufficient, DRAFT)?;
        }
        "backup" => connection.backup("main", payload, None)?,
        "hold" => {
            let transaction =
                connection.transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
            transaction.execute_batch(&payload)?;
            println!("ready");
            std::io::stdout().flush()?;
            std::io::stdin().read_line(&mut String::new())?;
            drop(transaction);
        }
        _ => return Err("unknown experiment worker operation".into()),
    }
    Ok(())
}

fn main() {
    let arguments: Vec<String> = std::env::args().collect();
    if arguments.get(1).map(String::as_str) == Some("--worker") {
        if let Err(error) = worker(&arguments[2], &arguments[3]) {
            eprintln!("{error}");
            std::process::exit(2);
        }
        return;
    }
    let scenarios: &[(&str, fn())] = &[
        ("restart", restart_recovers_original_and_reports),
        ("duplicate_import", repeated_import_keeps_progress),
        ("conflicting_import", conflicting_original_is_rejected),
        (
            "interrupted_transaction",
            crash_rolls_back_provider_and_checkpoint,
        ),
        ("competing_writer", competing_writer_is_rejected),
        (
            "evidence_support",
            inactive_resource_and_evidence_are_separate,
        ),
        ("backup", backup_recovers_pending_work),
    ];
    if arguments.get(1).map(String::as_str) == Some("--scenario") {
        let (name, scenario) = scenarios
            .iter()
            .find(|(name, _)| *name == arguments[2])
            .expect("known scenario");
        scenario();
        println!("PASS {name}");
    } else {
        for (name, scenario) in scenarios {
            scenario();
            println!("PASS {name}");
        }
        println!(
            "7/7 offline synthetic storage scenarios passed. No sending or network operations."
        );
    }
}
