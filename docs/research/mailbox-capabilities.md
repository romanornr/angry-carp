# Mailbox and analysis capabilities

Research date: 2026-09-21. This report informs the manual-run workflow decision. It does not choose an architecture or implementation language.

Update: the later [bounded capability check](manual-capability-check.md) verified Spam enumeration through the current connector and saved three RAW samples. The sections below describe the earlier documentation research; their untested claims should be read with those newer findings.

Gmail already provides original-message retrieval and Spam-inclusive discovery. The main uncertainty is which access method exposes those capabilities reliably and preserves enough evidence. A custom phishing scanner is not a prerequisite for acquiring messages.

## Gmail API capabilities

`users.messages.list` accepts `includeSpamTrash=true`, a search query, and label IDs. Label filters require all supplied labels, so `INBOX` and `SPAM` together do not mean either folder. Listing returns message and thread IDs, with at most 500 results per page. `nextPageToken` identifies another page. `resultSizeEstimate` is an estimate, not proof of complete acquisition. [Messages list reference](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list)

`users.messages.get` with `format=RAW` returns the entire message as base64url-encoded RFC 2822 content. `FULL` returns a parsed MIME structure. Gmail calls its message `id` immutable. `threadId` identifies a conversation and `historyId` identifies a change record; neither substitutes for the message ID. `internalDate` normally records Google's receipt time, with different rules for imported messages. [Message resource](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages)

The minimum mailbox-wide read-only scope for full bodies and search is `gmail.readonly`. `gmail.metadata` omits bodies and cannot use the listing method's `q` parameter. Read-only acquisition does not authorize sending reports or changing message labels. Gmail classifies `gmail.readonly` as a restricted scope, which matters if Angry Carp later becomes a distributed or hosted application. [Scope definitions](https://developers.google.com/workspace/gmail/api/auth/scopes), [messages list reference](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list)

Incremental acquisition can use `users.history.list` after an initial synchronization. History records include message additions, deletions, and label changes. History IDs increase but have gaps. Clients must consume pagination before saving the resulting checkpoint. An expired checkpoint returns HTTP 404 and requires a full synchronization; retention is typically at least a week but can be only hours. Manual runs therefore need recovery after long gaps. [History reference](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.history/list), [synchronization guide](https://developers.google.com/workspace/gmail/api/guides/sync)

Calendar dates in API searches use midnight PST. Epoch-second bounds avoid imposing that timezone on discovery in the operator's configured timezone. API searches also differ from Gmail's interface in alias expansion and thread-wide matching. A search-only implementation needs an explicit coverage strategy rather than assuming that the interface and API return identical results. [Search and filter guide](https://developers.google.com/workspace/gmail/api/guides/filtering)

## Access methods

| Method | Established capability | Limit or uncertainty |
| --- | --- | --- |
| Current Gmail connector | `read_email` exposes `raw`, `full`, `metadata`, and `minimal`. Search tools expose queries, exact `SPAM` label IDs, and page tokens. | No explicit `includeSpamTrash` parameter or history-list tool appears in the available schemas. Raw export fidelity, response limits, and complete Spam discovery need a bounded live check. |
| Google Workspace CLI, `gws` | Generates commands from Google Discovery documents, accepts API parameters, returns structured JSON, and supports pagination. | Its README disclaims official Google product support and warns of breaking changes before v1.0. This research does not establish it as a mature supported client. |
| Direct Gmail API through an existing client library or a small client | Explicit raw retrieval, Spam inclusion, OAuth scopes, and history synchronization. Google links client libraries in its API reference. | Angry Carp would own authentication setup, pagination, retries, evidence persistence, and recovery behavior. |

Connector evidence comes from the tool schemas available in this session: `mcp__codex_apps__gmail_read_email`, `gmail_search_emails`, `gmail_search_email_ids`, and `gmail_batch_read_email`. No Gmail tool was called during this research. The batch-read schema limits a request to 100 messages, ignores later IDs, and fails above a 100 MB combined serialized response. A schema establishes advertised capability, not tested behavior or mailbox coverage. Earlier conversational claims about successful mailbox reads were not independently verified here.

The CLI is worth evaluating before writing another mailbox client. Its `--page-all` mode still has a documented default page limit of 10. Its authentication source includes `gmail.readonly` in a read-only preset, but that preset also includes other services. Any trial needs explicit Gmail-only scopes and a check of the pinned version's options. Dynamic API coverage suggests access to raw retrieval and Spam parameters; this remains an inference until tested. [CLI README](https://github.com/googleworkspace/cli), [authentication source](https://github.com/googleworkspace/cli/blob/main/crates/google-workspace-cli/src/auth_commands.rs)

## Extraction and phishing assessment are separate jobs

The following are design implications, not a claim that a selected parser or classifier already implements them.

Deterministic processing can preserve downloaded bytes, decode MIME, extract text and literal URLs, compare visible link text with destinations, hash evidence, and count repeated indicators. These operations do not require contacting candidate infrastructure. Parsing HTML as data must not render it or fetch remote content. An extracted URL shows what the message contains; it does not establish the destination's current behavior.

Rules can prioritize unusual authentication results, credential requests, recurring text, or sender discrepancies. They cannot turn every discrepancy into proof of phishing. Contextual assessment asks what identity the message claims, what action it requests, and what evidence shows deception. AI may help answer those questions, but its verdict needs cited message evidence and an explicit uncertain outcome. No evidence gathered here establishes that every message needs model review, or that a fixed ruleset can safely replace it.

Authentication results require a trust boundary. Attackers can supply header text, and successful authentication does not prove that content is benign. RFC 8601 distinguishes authentication from deciding whether a message is desirable. [Authentication-Results specification, sections 1.5 and 7](https://www.rfc-editor.org/rfc/rfc8601.html)

For campaign intelligence, repeated domains or templates can support a proposed cluster. They do not prove a common operator. Mailbox counts measure messages observed in this mailbox during a recorded interval, not a phisher's global activity. Preserve that distinction before designing a dashboard.

## Facts still needed before choosing an implementation

The next capability check can use a few user-selected messages, including Spam, to compare complete raw exports and paginated discovery against a known baseline. It should establish connector response limits and whether a reusable CLI exposes all required parameters. Scope selection, local evidence retention, and the boundary between model inputs and private originals remain decisions for the workflow specification.

Context7 resolved and queried the official Gmail documentation and `googleworkspace/cli`; linked primary sources filled gaps in the retrieved excerpts. No credentials, private mail, candidate URLs, installations, or submissions were used.
