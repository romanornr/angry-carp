use std::{env, fs, io};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let paths: Vec<_> = env::args_os().skip(1).collect();
    if paths.is_empty() {
        return Err(io::Error::other("usage: mailbox-export-check ORIGINAL.eml ...").into());
    }
    let mut reports = Vec::new();
    for path in paths {
        let original = fs::read(&path)?;
        let report = mailbox_export_check::audit(&original)?;
        if original != fs::read(&path)? {
            return Err(io::Error::other("Source bytes changed during the audit").into());
        }
        reports.push(report);
    }
    println!("{}", serde_json::to_string_pretty(&reports)?);
    Ok(())
}
