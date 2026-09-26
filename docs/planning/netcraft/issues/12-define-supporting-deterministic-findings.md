# Define which deterministic findings support automatic submission

Type: grilling
Status: open
Assignee: unassigned
Parent: ../map.md

## Question

[ADR 0019](../../../adr/0019-submit-urls-to-netcraft-automatically.md) requires High concern plus at least one deterministic analyzer finding before a URL is submitted automatically, so a model error cannot send alone. Which existing analyzer findings qualify, such as reference-domain impersonation, lookalike observations, recent registration or failed authentication claims, and must the finding concern the submitted URL's own host rather than the message in general? Which findings are too weak on their own?
