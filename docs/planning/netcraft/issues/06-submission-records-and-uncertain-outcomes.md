# Submission records, deduplication and uncertain outcomes

Type: grilling
Status: open
Assignee: unassigned
Parent: ../map.md
Blocked by: 03

## Question

How is a threat-feed submission recorded in the SQLite case store, before and after it is sent? How does Angry Carp avoid resubmitting a URL already sent from another case, and how does it treat 429 and "Duplicate of a recent submission" responses? When a submission times out, the public API offers no idempotency key and no listing, so how is the uncertain submission recorded and later resolved? Result emails are not read, per the reporting-identity ticket. Consider whether resubmitting and reading a "Duplicate of a recent submission" rejection may confirm the earlier delivery, and what is lost when the original UUID stays unknown.
