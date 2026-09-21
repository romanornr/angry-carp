# Private scan boundary check

Checked 2026-09-21 through Context7 and official urlscan documentation. No scan was submitted.

## Verified provider behavior

urlscan distinguishes private from unlisted scans. Unlisted results are available to vetted researchers and security companies. Private results can be accessed when their scan ID is shared, so the ID and result link need disclosure review. Omitting visibility uses the account default. The submission response includes the resulting visibility. Private-scan quota is separate from other visibility quotas. [urlscan API documentation](https://urlscan.io/docs/api/)

## Design consequences

Request private visibility explicitly, check the response, and never retry with unlisted or public visibility. A visibility mismatch requires a recorded disclosure incident and investigation; checking the response cannot undo an already exposed submission. Account configuration and an integration capability test must establish private behavior before candidate submissions are enabled.

Private result visibility does not prevent the scanner from requesting the target. As a consequence, recipient identifiers or access tokens in the submitted URL could reach the target even if the result remains private. This is a consequence of the requested scan, not a claim that private scans provide anonymity. Apply the privacy rules before submission, including to reduced targets and search queries.

Use a harmless operator-approved target to test account capability and result retrieval later. Do not use a candidate URL as the integration test. The [manual workflow](../manual-workflow.md) leaves scanning disabled until capability and budget configuration exist.
