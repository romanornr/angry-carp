---
status: accepted
---

# Preserve complete original messages privately

Angry Carp retains complete original source messages in a private evidence store outside Git, rather than keeping only parsed summaries or redacted extracts. Preserve the original message content returned by the mailbox provider unchanged and keep derived evidence and assessments separate, so later investigation, pattern analysis, and evaluation can revisit what the message actually contained. This accepts the storage and privacy responsibilities of retaining originals because discarded source material cannot be reconstructed from summaries.

The later [local storage decision](0006-use-sqlite-for-local-case-storage.md) selects SQLite for originals and case records. The operator clarified that ordinary-email content must not be retained simply because it was acquired for assessment; this evidence decision does not authorize a general mailbox archive. Investigation retention duration and temporary handling still need design. Retaining a message does not permit executing its attachments or fetching remote content. Future model training is a possible separate use, not permission to upload retained messages or treat current assessments as verified training labels.
