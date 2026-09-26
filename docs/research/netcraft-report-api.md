# Netcraft Report API and reference designs

Researched 2026-09-26 for [the Netcraft map](../planning/netcraft/map.md). No request was sent to Netcraft other than documentation GETs; nothing was submitted.

## Official specification

Netcraft's documentation page is an Angular application that renders an OpenAPI document with Redoc. The document itself is at `https://report.netcraft.com/api/v3/api.json` (OpenAPI 3.0.0, `info.version` "Version 3", not deprecated). The copy read on 2026-09-26 had sha256 `c8aa1db5851fd3ceabe88d03f67089d94ae8dac60afa9d881162b41b0aeb7c4c`. Versions 1 and 2 are marked deprecated. Facts below come from that document unless another source is named.

- **Sandbox.** Every endpoint has a twin under `/api/v3/test`, "which can be used to test your API clients without causing any destructive actions".
- **Authentication.** Report and submission endpoints declare no security scheme, and the official samples send no key. The reporter `email` is the identity. The report endpoints still list 401 and 403 responses without explaining when they occur.
- **`POST /report/urls`.** Required: `email`, `urls`. Optional: `reason` (maximum 10,000 characters), `source` (only when Netcraft issued one), `skip_invalid_urls`, `no_submission` (restricted to some submitters). Each `urls[]` item may carry `url`, `country`, `reason`, `screenshot {base64, ext}` and `tags` (`smishing`). Up to 1,000 URLs per submission. The response is `{message, uuid, invalid_urls?}`.
- **`POST /report/mail`.** Required: `email`, `message` (MIME text, or AES-256-CBC ciphertext when `password` is set; maximum 20 MiB). There is no file-report endpoint.
- **`GET /submission/{uuid}`.** Returns either a pending stub `{date, pending: 1, submitter}` or the submission. Submission `state` is `processing`, `no threats`, `suspicious` or `malicious`, and "a submission may be assigned a higher-severity state several days after its initial classification". Every level carries a `classification_log` of `{date, from_state, to_state}`.
- **`GET /submission/{uuid}/urls`.** Paged with `count` (default 25, maximum 1,000). Each URL has `url_state` (`processing`, `no threats`, `unavailable`, `malicious`, `rejected`, `suspicious`), `url_takedown_state` (`not injected`, `not started`, `in progress`, `resolved`), `url_classification_reason`, `incident_report_url` (present only when Netcraft performs takedown action), `screenshots[] {hash, type}` and its own `classification_log`.
- **Screenshots.** `GET /submission/{uuid}/urls/{url_uuid}/screenshots/{hash}` returns the PNG or GIF that Netcraft's crawler captured.
- **Follow-ups.** `POST /submission/{uuid}/report_issue` flags false negatives (`additional_info`, `url_misclassifications[] {url, reason, screenshot}`). `POST /report/mistake {email, url, reason}` asks for review of an incorrectly blocked URL.
- **Archival.** Submissions are archived after 30 days by default. Afterwards every submission endpoint except `/submission/{uuid}` returns 404 "this submission has been archived".
- **Errors.** `ErrorModel {status, error, details[{message, input, path}]}`. Report endpoints document 429 with no limits and no rate-limit headers.
- **Duplicates.** No idempotency key and no public way to list one's own submissions. A URL can be `rejected` when "already reported and determined to be safe".
- **Visibility and data use.** A submission page is viewable by anyone holding its UUID link. Netcraft's privacy policy says reported URLs are crawled and that threat indicators may be shared with hosting companies, registrars, law enforcement and other parties able to stop an attack. Anonymous reports through the web form are "not eligible for credit"; the API always requires `email`.

The state values appear only in description prose, not as schema enums, and response schemas declare no required fields. Clients should tolerate unknown states and absent fields.

## Netcraft's two services

The public Report API above is free to use. Netcraft's takedown service at `takedown.netcraft.com` (API v1) serves customer organisations and needs an account API key. Public reports may still reach takedown handling; `url_takedown_state` and `incident_report_url` record that, and the specification does not say when it happens.

## Reference implementations

Each project is pinned to the commit that was read. Licence matters for reuse: ideas and API facts can be cited from any of them, code only from licensed ones.

| Project | Commit | Licence | Assessment |
| --- | --- | --- | --- |
| [demisto/content, Netcraft V2](https://github.com/demisto/content/tree/cccfa684bc08d02989a03c3ff5ba5e16fbe638de/Packs/Netcraft_V2) (Palo Alto Cortex XSOAR) | `cccfa684` | MIT | Most established: vendor-maintained, listed by Netcraft. Reference for endpoint surface and command structure, not for failure handling. Uses a customer API key; do not copy its authentication. |
| [matchmoments-admin/ask-arthur](https://github.com/matchmoments-admin/ask-arthur/tree/81d63a9177fbce66814a47809ad5c14145f8694d/apps/web/lib/clone-watch) | `81d63a91` | none | Production TypeScript with measured outcomes. Best source of observed API behaviour and error classification. Storage design not worth copying. |
| [DavidJKTofan/phishing-submission-collector](https://github.com/DavidJKTofan/phishing-submission-collector/tree/5ffaf6059b6b1867630c2343d917ce08823332b2) | `5ffaf605` | none | Clean approval gate and per-provider durable steps. Blind retries after timeouts. |
| [akacdev/Netcraft](https://github.com/akacdev/Netcraft/tree/a6c9ba8c53829fb767b176a45d3fe5fb49569f13) | `a6c9ba8c` | MIT | C# library. Field-name and error-model reference only; dormant, untested, several bugs. |
| [maaaaz/pynetcraftcli](https://github.com/maaaaz/pynetcraftcli/tree/08a9a5ce862b95e5023d14a6d0067b82d053c58b) | `08a9a5ce` | LGPL-3.0+ | Source of the `credited` URL tag. Otherwise sloppy. |
| [jcoscia/PhishSubmit](https://github.com/jcoscia/PhishSubmit/tree/240fe171e8e00ae7c011c1fc7afc5e1c88c6c8d8) | `240fe171` | MIT | Records the "Duplicate of a recent submission" rejection text and an honest dry-run mode. |
| [Cybersight-Security/Netcraft-API-Client](https://github.com/Cybersight-Security/Netcraft-API-Client/tree/52939a70b94090211abbd04c5f8685fd994919b8) | `52939a70` | GPL-3.0 | Endpoint leads only. |
| [faseehfawaz/outpost](https://github.com/faseehfawaz/outpost/tree/ccba0cee03130f6d6f226b6219280b67d3726a52) | `ccba0cee` | MIT | Anti-pattern: reports success when nothing happened. |

None of the projects records an uncertain submission, validates Netcraft responses against a schema, or tests against recorded HTTP responses.

## Patterns worth adopting

Each entry names where it was observed. Permalinks point at the pinned commits.

- **One transport wrapper that strips absent fields, and one error hook reporting status, reason and body.** XSOAR [`submission_http_request`](https://github.com/demisto/content/blob/cccfa684bc08d02989a03c3ff5ba5e16fbe638de/Packs/Netcraft_V2/Integrations/Netcraft/Netcraft.py#L82-L126) and [`client_error_handler`](https://github.com/demisto/content/blob/cccfa684bc08d02989a03c3ff5ba5e16fbe638de/Packs/Netcraft_V2/Integrations/Netcraft/Netcraft.py#L128-L136). Parse the body with the official `ErrorModel` rather than dumping it.
- **One shared "submit, then track" tail for every report kind.** XSOAR [`submission_report_results`](https://github.com/demisto/content/blob/cccfa684bc08d02989a03c3ff5ba5e16fbe638de/Packs/Netcraft_V2/Integrations/Netcraft/Netcraft.py#L1026-L1036).
- **Tolerate a brief 404 or pending stub right after submission.** XSOAR [`get_submission` polling](https://github.com/demisto/content/blob/cccfa684bc08d02989a03c3ff5ba5e16fbe638de/Packs/Netcraft_V2/Integrations/Netcraft/Netcraft.py#L908-L969); the official schema's `PendingSubmission` names the same state.
- **Pure builders, classifiers and planners around thin I/O.** ask-arthur [`buildNetcraftBulkBody`](https://github.com/matchmoments-admin/ask-arthur/blob/81d63a9177fbce66814a47809ad5c14145f8694d/apps/web/lib/clone-watch/netcraft-report.ts#L81), [`classifyByUrlState`](https://github.com/matchmoments-admin/ask-arthur/blob/81d63a9177fbce66814a47809ad5c14145f8694d/apps/web/lib/clone-watch/netcraft-urls.ts#L411) and [`planReconcile`](https://github.com/matchmoments-admin/ask-arthur/blob/81d63a9177fbce66814a47809ad5c14145f8694d/apps/web/lib/clone-watch/netcraft-urls.ts#L638), each covered by table tests.
- **I/O that returns outcomes instead of throwing, with status 0 for transport failure.** ask-arthur [`postNetcraftBulk`](https://github.com/matchmoments-admin/ask-arthur/blob/81d63a9177fbce66814a47809ad5c14145f8694d/apps/web/lib/clone-watch/netcraft-report.ts#L156) and [`fetchNetcraftSubmissionUrls`](https://github.com/matchmoments-admin/ask-arthur/blob/81d63a9177fbce66814a47809ad5c14145f8694d/apps/web/lib/clone-watch/netcraft-urls.ts#L483).
- **Three-way rejection classification: transient (0, 429, 5xx), not yet (400 "fully processed"), permanent (other 4xx).** ask-arthur [`classifyIssueReject`](https://github.com/matchmoments-admin/ask-arthur/blob/81d63a9177fbce66814a47809ad5c14145f8694d/apps/web/lib/clone-watch/netcraft-issue-report.ts#L169). Authentication and configuration failures never retry, as in phishing-submission-collector [`ProviderAuthError`](https://github.com/DavidJKTofan/phishing-submission-collector/blob/5ffaf6059b6b1867630c2343d917ce08823332b2/src/shared.ts#L97).
- **Read back before a retry once a UUID exists.** ask-arthur checks `has_issues` before [`postNetcraftIssue`](https://github.com/matchmoments-admin/ask-arthur/blob/81d63a9177fbce66814a47809ad5c14145f8694d/apps/web/lib/clone-watch/netcraft-issue-report.ts#L120).
- **Read per-URL `url_state`, not the submission roll-up, and request `count` explicitly.** ask-arthur [`netcraft-urls.ts`](https://github.com/matchmoments-admin/ask-arthur/blob/81d63a9177fbce66814a47809ad5c14145f8694d/apps/web/lib/clone-watch/netcraft-urls.ts#L22-L28) records silently dropped URLs beyond the default page of 25.
- **Bounded follow-up rounds per reason, ending as "exhausted".** ask-arthur [`NETCRAFT_DEFERRAL`](https://github.com/matchmoments-admin/ask-arthur/blob/81d63a9177fbce66814a47809ad5c14145f8694d/apps/web/lib/clone-watch/netcraft-deferral.ts#L34).
- **One record per provider submission, keyed by report and provider, with a constrained status column.** phishing-submission-collector [`provider_reports`](https://github.com/DavidJKTofan/phishing-submission-collector/blob/5ffaf6059b6b1867630c2343d917ce08823332b2/migrations/0001_baseline.sql#L33-L46).
- **An evidence gate before automatic submission.** ask-arthur [`passesEvidenceGate`](https://github.com/matchmoments-admin/ask-arthur/blob/81d63a9177fbce66814a47809ad5c14145f8694d/apps/web/lib/clone-watch/netcraft-urls.ts#L161); its operators measured 89.4% of submissions declined before adding it.

## Patterns to avoid

- Retrying a timed-out submission blindly. phishing-submission-collector can send the same URL up to three times; ask-arthur resubmits the batch on the next run.
- Stopping at the first non-`processing` state. XSOAR never observes a later escalation.
- Inferring status from which JSON keys exist. ask-arthur needed repeated migrations to repair rows stuck by this.
- Treating `unavailable` as a verdict. It means Netcraft could not fetch the content when it scanned.
- Sending submitter names or free text to the service, as phishing-submission-collector does.
- Casting responses without validation, as every surveyed project does.

## Observed behaviour not in the specification

These come from reference-project comments and code, not from Netcraft.

- ask-arthur reports that `report_issue` answers 400 "Please wait until the submission has been fully processed" while processing takes 0 to 12.1 hours (median about five minutes), and that only one issue per submission is accepted.
- PhishSubmit treats a response body containing "Duplicate of a recent submission" as already reported. The status code and window are unknown.
- pynetcraftcli treats a malicious URL carrying the tag `credited` as credited to the submitter.
