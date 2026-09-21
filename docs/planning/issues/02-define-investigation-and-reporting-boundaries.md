# Define investigation and reporting boundaries

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Assignee: operator with Codex
Parent: ../map.md
Blocked by: none

## Question

What may a manual Angry Carp run inspect, disclose, and submit automatically, and which actions require the operator's decision? Keep direct visits to candidate URLs and attachment execution prohibited. Resolve the distinction between existing third-party observations and requesting a new scan, allowable evidence disclosure, and whether automatic High-confidence email reporting carries into the new system or starts with review.

## Comments

The operator confirmed that Angry Carp must never visit the candidate phishing link directly. The distinction between a direct visit and a visit performed by urlscan was explained. The boundary is recorded in [Prohibit direct fetches of candidate phishing resources](../../../docs/adr/0001-prohibit-direct-candidate-fetches.md).

The operator chose automatic external scans under agreed privacy rules for the future system. Approval per scan is not the intended default.

The operator accepted private scans only, excluding OTPs, magic links, session credentials, account-access URLs, and identifiable recipient data. The exclusion explicitly covers email addresses, names, full names, home and office addresses, birthdays, and other private information. Uncertain targets go to review. No emails or attachments go to scanners. If private scanning is unavailable, scanning waits rather than falling back to public visibility. These boundaries are recorded in [Limit evidence disclosed to external scanners](../../../docs/adr/0002-limit-scanner-disclosure.md).

The operator allows specific page URLs when the entire URL passes the privacy checks. Automatic scans are not restricted to domains. A domain-only observation must not be represented as inspection of the original linked page. The private source evidence remains unchanged.

The operator chose approval for every prepared report in the first version, including High-confidence reports. Automatic sending of eligible High-confidence reports is a later goal. Classification does not confer permission to send, and starting a manual run is not approval of its reports. No operational sending is authorized during planning.

Reference: [phishing evidence options](../../../docs/research/phishing-evidence-options.md).

## Answer

The initial system runs manually and prepares every report for the operator's approval, regardless of classification. It never fetches candidate phishing resources directly or executes candidate attachments.

External scans may run automatically with private visibility when the entire target URL passes the agreed privacy checks. Specific page URLs are allowed. No emails, attachments, private recipient information, or account-access secrets go to scanners. Uncertain targets require review; unavailable private scanning postpones the scan without a public fallback. Source evidence remains unchanged, and scan claims stay tied to the actual submitted target.

The architectural boundaries are recorded in [Prohibit direct fetches of candidate phishing resources](../../../docs/adr/0001-prohibit-direct-candidate-fetches.md) and [Limit evidence disclosed to external scanners](../../../docs/adr/0002-limit-scanner-disclosure.md). Technical enforcement remains an architecture decision. The separate question of evidence shared with verified abuse desks is tracked in [Define report evidence and approval](06-define-report-evidence-and-approval.md).
