# Classify malformed lookup JSON without a transport retry

Type: bug
Status: implemented
Priority: medium
Parent: ../map.md
Blocked by: none

## Reproduction and resolution, 2026-09-22

An HTTP 200 response containing malformed JSON reached `requestJson`'s general exception handler. The analyzer reported `request_failed` and retried it as a transient transport failure. This contradicted the existing policy for invalid responses.

JSON parsing now has its own error boundary and returns `unavailable/invalid_response`. No raw response or exception text is returned. An important invalid response still requires assessment because its check is incomplete.

The analyzer regression failed before the correction with `request_failed` instead of `invalid_response`. It passes afterward and verifies one request, an explicit assessment route and no response-body disclosure. Other transient failures retain the existing bounded retry behavior.

The earlier live RDAP failure remains unexplained. This test demonstrates a classification defect, not the cause of that historical failure. See [the investigation](../../research/assessment-evidence-limits.md).
