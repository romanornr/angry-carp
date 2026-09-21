# Response to the independent review

Recorded 2026-09-21. The operator requested independent research from the existing Claude Code tab. Its [review](claude-independent-review.md) remains a second opinion, with proposals distinct from accepted decisions.

## Incorporated

- Added role-specific evidence starting points and explicit handling of missing screenshots to the canonical reporting guide. A private scan is one source of screenshots; existing scans and operator-supplied evidence are also possible.
- Added registrar contact resolution through authoritative RDAP or ICANN Lookup. Independently checked the [ICANN profile](https://www.icann.org/gtld-rdap-profile) and [response specification](https://itp.cdn.icann.org/en/files/registry-operators/rdap-response-profile-21feb24-en.pdf). This identifies the registrar's abuse contact, not an arbitrary registrant or the page's host.
- Specified a prepared MIME message for the reusable email sender, approval bound to its digest and envelope recipients, and reconciliation identifiers. The actual transport still needs a fidelity check.
- Added attempts to manipulate recipients, disclosure, fetches, and approval to the synthetic runner comparison. Added the requirement to restrict send paths that could bypass case operations.
- Retained capability checks for Spam acquisition, raw export fidelity, delivery, host restrictions, private scanning, and recovery. Research cannot substitute for those observations.

## Proposals that remain open

The review recommends file-based cases with a private Git repository, GYB or lieer for acquisition, and a fixed workflow before a broader runner. These are comparison candidates. No client, implementation language, storage format, or runner was selected. See the review's tool list for starting points and stated reservations.

A local case directory may be enough, but file storage still needs coherent updates, recovery, privacy, and approval authority. Those requirements exist even with a single writer. Git history and an append-only journal do not demonstrate atomic recovery by themselves. A private Git archive also conflicts with the current decision to retain originals outside Git, so it has not been adopted.

The review calls some proposed network and sending operations pure functions. They have external effects and must preserve attempts and uncertain results. Reusing a client can reduce custom code, but does not remove Angry Carp's responsibility for those outcomes.

Budget defaults remain open. Manual approval does not bound automatic model spending, scans, retries, or acquisition work. The historical daily caps should not silently become defaults, but this review does not authorize removing agreed budget requirements.

NetBeacon is worth a separate channel and disclosure comparison. No submission through it was authorized or attempted. Its relationship to a reporting guide does not establish that its form exactly implements every field or accepts Angry Carp's redacted evidence.

## Corrections to stronger claims

A checksum writable by the analyst is not proof of human approval. The approval interaction and permissions must establish that authority independently of the digest. A field-based connector is not automatically incapable of preserving approved content, but its actual behavior needs verification.

Require unchanged approved recipients, authored content, and attachment bytes through the sender. Account for transport-added headers when inspecting the stored copy instead of requiring every byte of the entire stored message to match. Message-ID search can assist reconciliation; an absent search result alone does not prove a timed-out send failed.

A fixed workflow can constrain tool use, but it does not settle prompt-injection risk. Corrupted assessments, proposed recipients, and disclosure selections can still influence later actions. A tool-choosing runner can also expose restricted operations. Compare the actual permissions and approval behavior rather than infer safety from the runner category.

Do not strengthen the held historical AWS example from suspected impersonation to an unqualified phishing accusation solely to match a subject convention. The NiceNIC example remains a held Medium case, not a ready-to-send registrar report with missing attachments. Keep allegation history accurate, including corrections, rather than force later conclusions to match an unsupported earlier allegation.
