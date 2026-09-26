# Mature designs for outbound submission life cycles

Type: research
Status: resolved
Assignee: claude
Parent: ../map.md

## Question

The surveyed Netcraft clients do not handle a submission whose outcome is unknown. How do established, well-maintained systems record an outbound request before sending it, classify failures, retry safely without an idempotency key, mark outcomes uncertain and reconcile them later, and poll a remote verdict with bounded follow-ups? Candidates include the transactional outbox pattern, payment-provider idempotency guidance, durable workflow engines, and security-automation projects such as IntelMQ, TheHive Cortex responders or MISP. For each adopted pattern, record the project, licence and pinned permalink, and judge its fit for a local SQLite case store.

## Answer

Researched 2026-09-26. Without an idempotency key or a way to list one's own submissions, an indeterminate send cannot be made safe by retrying or by reading back. The established answer is to record intent first, never retry an unknown outcome automatically, and hand it to a person.

**Sources and what they contribute**

- [Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) and [polling publisher](https://microservices.io/patterns/data/polling-publisher.html) (microservices.io): commit the intent row before any network I/O. Its duplicate safety relies on an idempotent receiver, which Netcraft is not. A relay or daemon is unnecessary; the next command run picks up due work.
- [Brandur Leach, idempotency keys in Postgres](https://brandur.org/idempotency-keys): the closest fit. Recovery points are stored on the row and committed before a non-idempotent "foreign state mutation". An indeterminate error such as a connection reset or timeout is marked as failed and listed for a human, not retried.
- [Stripe low-level error handling](https://docs.stripe.com/error-low-level) and `Stripe-Should-Retry`: confirm three outcome classes, namely retry, do not retry, and cannot tell. Stripe resolves "cannot tell" with an idempotency key Netcraft lacks.
- [AWS Builders' Library, making retries safe](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/): without a client token the options are reconciliation or accepting uncertainty. [Exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/): capped exponential backoff with full jitter.
- [Temporal](https://docs.temporal.io/encyclopedia/retry-policies) and [Restate](https://docs.restate.dev/guides/error-handling): transient versus non-retryable vocabulary. Their at-least-once default is wrong for a non-idempotent POST, and the engines are unnecessary for a local CLI.
- Counter-example: IntelMQ's REST output bot re-posts on any `requests` timeout, including read timeouts after the request was sent ([certtools/intelmq@bbe452a2 `output.py` L54-L73](https://github.com/certtools/intelmq/blob/bbe452a20d9fbf7b6213a85c1591a9f31bee0235/intelmq/bots/outputs/restapi/output.py#L54-L73), AGPL-3.0). Its dump file for failed messages is a useful human-resolution queue.
- MISP sync reads back by a client-chosen event UUID before create or update ([MISP/MISP@794511ea `ServerSyncTool.php`](https://github.com/MISP/MISP/blob/794511eabe96fbed34c76c990cfdc872b801421c/app/Lib/Tools/ServerSyncTool.php#L121-L145), AGPL-3.0). That works only because the receiver keys on the client's UUID, which Netcraft does not.
- TheHive Cortex jobs have no unknown state ([TheHive-Project/Cortex@9f1bc90a `Job.scala` L11-L13](https://github.com/TheHive-Project/Cortex/blob/9f1bc90ae92d4ba5e843439389f234e25489db1e/app/org/thp/cortex/models/Job.scala#L11-L13)); not a model.

**Failure classes**

| Class | Examples | Handling |
| --- | --- | --- |
| Not sent | DNS failure, connection refused, connect or TLS timeout before the body was written | Retry later |
| Not processed | 429 (an assumption about Netcraft, unconfirmed) | Retry later |
| Rejected | Other 4xx | Terminal |
| Unknown | Response timeout, reset after the body was written, 5xx, unparseable 2xx | Never retry automatically |

The mapping from Node and undici error codes to "before or after the body was written" is unverified and must be checked against undici's source before the specification is frozen.

**Libraries.** The retry policy that matters runs across command runs as scheduled columns in SQLite, which no library owns. For in-run retries of idempotent GET polls only: [cockatiel](https://github.com/connor4312/cockatiel/tree/80b5ed67966dfcc5410a912285fcb3eeb2dc5e5e) (MIT, zero dependencies, predicate and result classification, decorrelated jitter) or [p-retry](https://github.com/sindresorhus/p-retry/tree/1472907affe8d6107aba5884abc36d6361b3042e) (MIT). p-retry retries network `TypeError`s by default ([`index.js` L170-L172](https://github.com/sindresorhus/p-retry/blob/1472907affe8d6107aba5884abc36d6361b3042e/index.js#L170-L172)), so no retry library may wrap the submission POST.

**Polling without a daemon.** Due rows are selected by `next_check_at` when relevant commands run. A single `UPDATE … WHERE state = 'queued'` inside `BEGIN IMMEDIATE` claims a row against a second terminal; leases are unnecessary. Polling follows a bounded ladder of growing intervals capped by the 30-day archive and continues past the first verdict.

**Proposed state model for the submissions ticket (not adopted).** `queued` (intent committed) → `sending` (claimed and committed before the POST) → `submitted` (UUID stored, polled on a ladder) → `closed` (ladder exhausted or archived). Failures lead to `queued` with backoff for not sent or 429, `rejected` for permanent 4xx, and `unknown` for indeterminate outcomes. A row found still `sending` at startup also becomes `unknown`. An operator resolves `unknown` by supplying the UUID from out-of-band evidence such as Netcraft's result email, declaring it not sent, or explicitly accepting a possible duplicate.
