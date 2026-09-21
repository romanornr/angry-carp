use std::process::Command;

fn scenario(name: &str) {
    let output = Command::new(env!("CARGO_BIN_EXE_storage-recovery-experiment"))
        .args(["--scenario", name])
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    assert_eq!(
        String::from_utf8(output.stdout).unwrap(),
        format!("PASS {name}\n")
    );
}

#[test]
fn restart() {
    scenario("restart");
}
#[test]
fn duplicate_import() {
    scenario("duplicate_import");
}
#[test]
fn conflicting_import() {
    scenario("conflicting_import");
}
#[test]
fn interrupted_transaction() {
    scenario("interrupted_transaction");
}
#[test]
fn competing_writer() {
    scenario("competing_writer");
}
#[test]
fn evidence_support() {
    scenario("evidence_support");
}
#[test]
fn backup() {
    scenario("backup");
}
