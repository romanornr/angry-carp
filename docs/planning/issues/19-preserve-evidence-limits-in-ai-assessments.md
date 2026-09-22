# Preserve evidence limits in AI assessments

Type: bug
Status: open
Priority: medium
Assignee: unassigned
Parent: ../map.md
Blocked by: none
Related: 18-verify-evidence-during-report-preparation.md

## Observed gap

The 2026-09-22 live retest produced the expected High-concern assessment and discussed the image/action mismatch. Its summary nevertheless described Cloudflare as providing "DNS/proxy infrastructure". The supplied checks established authoritative DNS and network registration. Neither check established proxy behavior, origin hosting, Workers or Pages.

The answer also said that nothing indicated omitted HTML style/comment content would reverse the assessment. That content was not examined. The answer can explain why the available evidence supports its conclusion, but cannot imply that missing evidence was checked for contrary facts.

The deterministic output retained both limitations. This is a synthesis defect, not a missing lookup or a reason to fetch a candidate site. The private terminal record is retained under the ignored `evidence/emails/` directory; no message content or identifiers are needed in this ticket.

## Proposed correction

Inspect the existing model projection and Flue assessment instructions together. Preserve the distinction between DNS service, address registration and observed hosting behavior through the final answer. Keep omitted-content coverage explicit without inventing an effect on the verdict.

Prefer the smallest correction at that boundary. Do not add provider-specific exceptions, another lookup, a second model pass or a general rules engine. Keep Flue integration guidance outside the portable assessment document. Any change to the portable evidence rule must also make sense for other hosts.

## Acceptance checks

- A synthetic record with DNS and network-registration evidence supports those two relationships, without claiming observed proxy or origin hosting.
- Coverage for unexamined HTML stays unexamined in the assessment. Available evidence may still support High concern.
- Qualified sending-platform leads remain usable for investigation without acquiring confirmed attribution.
- Verify the projection contract offline, then evaluate the final wording in an agreed assessment run. A prompt-text assertion alone does not prove model behavior, and one successful answer does not establish a guarantee.
- No candidate URL, image or installer is fetched, and no report is sent.

Reporting-time verification remains a separate obligation under issue 18. Correcting assessment wording does not satisfy that step.
