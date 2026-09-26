# Decide whether operators may opt in to whole-message submission

Type: grilling
Status: resolved
Assignee: claude
Parent: ../map.md

## Question

URL-only submission is the default, and the operator prefers it: even after redaction, nobody can be sure a whole message carries no private detail. Should Angry Carp offer an explicit per-operator opt-in to submit whole messages, and if so, which redaction and verification must still pass, given the [redaction research](../../../research/redacted-message-submission.md): residual identifiers in bodies, links and attachments, and the `to` field exposed through the submission link?

## Answer

Decided with the operator on 2026-09-26: no. Whole messages are never submitted, not even by explicit opt-in. Operators may leak private details without understanding what a message discloses, and no redaction can guarantee a message carries none. [ADR 0019](../../../adr/0019-submit-urls-to-netcraft-automatically.md) states this.
