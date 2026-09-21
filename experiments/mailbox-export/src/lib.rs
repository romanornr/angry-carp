use mailparse::{DispositionType, MailParseError, parse_mail};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};

pub fn audit(raw: &[u8]) -> Result<Value, MailParseError> {
    let message = parse_mail(raw)?;
    let header_names: Vec<_> = message
        .headers
        .iter()
        .map(|header| header.get_key().to_ascii_lowercase())
        .collect();
    let parts: Vec<_> = message.parts().collect();
    let mut leaves = Vec::new();
    let mut attachment_count = 0;
    for part in &parts {
        if part.subparts.is_empty() {
            let body = part.get_body_raw()?;
            leaves.push(json!({"mime": part.ctype.mimetype, "size": body.len()}));
            if part.get_content_disposition().disposition == DispositionType::Attachment {
                attachment_count += 1;
            }
        }
    }
    Ok(json!({
        "bytes": raw.len(),
        "sha256": format!("{:x}", Sha256::digest(raw)),
        "header_names": header_names,
        "mime_types": parts.iter().map(|part| &part.ctype.mimetype).collect::<Vec<_>>(),
        "leaves": leaves,
        "attachment_parts": attachment_count,
    }))
}

#[cfg(test)]
mod tests {
    use super::audit;
    use serde_json::json;

    #[test]
    fn decodes_mime_parts_without_returning_their_contents() {
        let raw = concat!(
            "From: sender@example.invalid\r\n",
            "To: operator@example.invalid\r\n",
            "MIME-Version: 1.0\r\n",
            "Content-Type: multipart/mixed; boundary=sample\r\n\r\n",
            "--sample\r\nContent-Type: text/plain\r\n\r\nhello\r\n",
            "--sample\r\nContent-Type: application/octet-stream\r\n",
            "Content-Disposition: attachment; filename=sample.bin\r\n",
            "Content-Transfer-Encoding: base64\r\n\r\nAAECAw==\r\n",
            "--sample--\r\n",
        );
        let report = audit(raw.as_bytes()).unwrap();
        assert_eq!(
            report["leaves"],
            json!([
                {"mime": "text/plain", "size": 5},
                {"mime": "application/octet-stream", "size": 4}
            ])
        );
        assert_eq!(report["attachment_parts"], 1);
        assert_eq!(
            report["header_names"],
            json!(["from", "to", "mime-version", "content-type"])
        );
        assert!(!report.to_string().contains("operator@example.invalid"));
        assert!(!report.to_string().contains("hello"));
    }
}
