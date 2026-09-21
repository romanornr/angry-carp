---
status: accepted
---

# Limit evidence disclosed to external scanners

Angry Carp may request external scans automatically only with private visibility and a target that passes the privacy checks. It must not upload emails or attachments to scanners, or disclose OTPs, magic links, session credentials, account-access URLs, or private recipient information, including email addresses, names, home and office addresses, and birthdays. Uncertain targets require review; unavailable private scanning postpones the scan rather than changing its visibility.

This boundary accepts reduced scan coverage to limit disclosure. Specific page URLs may be submitted when the entire URL passes the privacy checks; automatic scans are not restricted to domains. The checks cover the hostname, path, query, and fragment because private information can occur in any of them.

Private source evidence stays unchanged. A scan of a reduced target records what was actually submitted and cannot establish the behavior or safety of the original, unscanned link. Scanner restrictions do not decide the separate evidence-sharing policy for verified abuse-report recipients.
