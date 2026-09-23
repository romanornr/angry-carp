---
status: accepted
---

# Render recorded assessment evidence

Repeated instruction changes passed small replays but failed full assessments: the model described different sender domains as unrelated without supporting evidence. The operator chose a structured conclusion and evidence selection instead of more prompt corrections. The model selects concern, confidence, a deception hypothesis and up to eight records with supporting, contrary or contextual roles. Code displays the stored records. There is no free-text explanation field or prose fallback.

`lib/src/email-analysis/analysis-output.ts` owns the schema, selectable records and renderer. Findings, registration records and explicitly supplied source notes retain their recorded meaning. The reviewed email text has a selectable label but is never printed. Unknown IDs, extra fields and missing results fail visibly. The deterministic findings and coverage appear before the optional assessment and remain visible on failure. The selection can still be wrong or incomplete; structure constrains what is displayed, not the truth of the hypothesis. Supplied source claims remain unverified.

Flue's [data writer](https://github.com/withastro/flue/blob/main/apps/docs/src/content/docs/guide/agent-hooks.md) carries the submission in `AgentReply.data.assessment`. The tool returns `terminate: true`, ending the current operation without a prose-generation turn. The CLI validates the result before displaying it. Flue continues a mixed tool batch unless every result terminates; multiple submissions then fail the CLI's single-result check. It does not start another operation when the model fails to submit. This uses existing Flue and Valibot dependencies. It replaces the former free-form evaluator and CLI output together. Flue may retain generated prose in its conversation history even though the CLI does not display it.

The separation has a precedent in [Cortex's structured taxonomy and summary output](https://github.com/TheHive-Project/cortexutils/blob/master/cortexutils/analyzer.py). We reuse the idea of structured judgments with separate rendering, not its level names or silent fallback to `info`. No RFC defines this assessment schema. The fields are a project contract, not a calibrated classifier or a standard interchange format.

The portable `phishing-triage.md` remains usable without this implementation. It cannot guarantee the same output boundary. Reporting-time research, operator approval and sending remain separate. No additional dependency, judge model, web retrieval or report submission is introduced.
