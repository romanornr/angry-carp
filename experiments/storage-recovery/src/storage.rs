use rusqlite::{Connection, Result, TransactionBehavior, params, types::ValueRef};
use sha2::{Digest, Sha256};
use std::time::Duration;

pub fn open(path: &str) -> Result<Connection> {
    let connection = Connection::open(path)?;
    connection.busy_timeout(Duration::ZERO)?;
    connection.execute_batch("PRAGMA foreign_keys=ON; PRAGMA synchronous=FULL;")?;
    Ok(connection)
}

pub fn import(
    connection: &mut Connection,
    id: &str,
    original: &[u8],
    sufficient: bool,
    draft: &[u8],
) -> Result<()> {
    let transaction = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let support = if sufficient {
        "sufficient"
    } else {
        "insufficient"
    };
    transaction.execute(
        "INSERT OR IGNORE INTO cases VALUES (?1,2,?2,?3)",
        params![
            id,
            support,
            "Synthetic assessment; insufficient evidence stays held."
        ],
    )?;
    transaction.execute(
        "INSERT OR IGNORE INTO originals VALUES (?1,?2,?3,?4,?5,?6)",
        params![
            format!("synthetic:{id}"),
            id,
            original,
            format!("{:x}", Sha256::digest(original)),
            "synthetic-file-fixture",
            "2026-09-21T10:00:00Z"
        ],
    )?;
    transaction.execute(
        "INSERT OR IGNORE INTO observations VALUES (?1,'apparently_inactive',?2)",
        params![id, "Synthetic observation; no lookup."],
    )?;
    transaction.execute(
        "INSERT OR IGNORE INTO reports SELECT id,'Synthetic registrar',
         CASE support WHEN 'sufficient' THEN 'confirmed_submitted' ELSE 'held' END,
         CASE support WHEN 'sufficient' THEN ?2 END,
         CASE support WHEN 'sufficient' THEN 'SYNTHETIC-PRIOR-RECEIPT-001' END,
         'Imported synthetic history; no submission occurred.' FROM cases WHERE id=?1",
        params![id, b"SYNTHETIC historical report\r\n".as_slice()],
    )?;
    transaction.execute(
        "INSERT OR IGNORE INTO reports SELECT id,'AWS',
         CASE support WHEN 'sufficient' THEN 'awaiting_approval' ELSE 'held' END,
         CASE support WHEN 'sufficient' THEN ?2 END,NULL,
         CASE support WHEN 'sufficient' THEN 'Operator review still pending.'
         ELSE 'An unavailable resource alone does not support an abuse claim.' END
         FROM cases WHERE id=?1",
        params![id, draft],
    )?;
    transaction.execute(
        "INSERT OR IGNORE INTO checkpoints VALUES ('synthetic-import','message-1')",
        [],
    )?;
    transaction.commit()
}

pub fn query(connection: &Connection, sql: &str) -> Result<String> {
    let mut statement = connection.prepare(sql)?;
    let columns = statement.column_count();
    let rows = statement.query_map([], |row| {
        (0..columns)
            .map(|index| {
                Ok(match row.get_ref(index)? {
                    ValueRef::Null => "NULL".to_owned(),
                    ValueRef::Integer(value) => value.to_string(),
                    ValueRef::Real(value) => value.to_string(),
                    ValueRef::Text(value) => String::from_utf8_lossy(value).into_owned(),
                    ValueRef::Blob(value) => {
                        value.iter().map(|byte| format!("{byte:02X}")).collect()
                    }
                })
            })
            .collect::<Result<Vec<_>>>()
            .map(|values| values.join("|"))
    })?;
    rows.collect::<Result<Vec<_>>>().map(|rows| rows.join("\n"))
}

pub fn snapshot(connection: &mut Connection) -> Result<String> {
    let transaction = connection.transaction()?;
    let mut snapshot = Vec::new();
    for (table, order) in [
        ("cases", "id"),
        ("originals", "import_id"),
        ("observations", "case_id"),
        ("reports", "case_id,provider"),
        ("checkpoints", "scope"),
    ] {
        snapshot.push(format!(
            "{table}\n{}",
            query(
                &transaction,
                &format!("SELECT * FROM {table} ORDER BY {order}")
            )?
        ));
    }
    transaction.commit()?;
    Ok(snapshot.join("\n"))
}
