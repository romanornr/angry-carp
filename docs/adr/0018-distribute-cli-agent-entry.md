---
status: accepted
---

# Give existing agents a CLI entry point

Existing agents should run the shared analyzer before interpreting an email. Distribute an executable and a short discovery skill whose workflow comes from the installed package. Keep command parsing in `cli/`, checks and disclosure in `lib/`, and Flue integration in `agent/`. This follows the [inspected CLI and skill precedents](../research/agent-entry-points.md), without adding a service or MCP server. The standalone Markdown workflow remains independently usable under ADR 0004.

Agent JSON reuses the assessment projection from ADR 0014. Full private analysis export remains separate. A broader JSON copy of the human terminal output would restore provider-routing material to the assessment model's context, so it is not the default agent view. Shared structured-assessment instructions move from `agent/` to `lib/instructions/`; Flue adds only its submission-tool requirement. The offline `assess` command reuses ADR 0016's validation and rendering against retained packet evidence, without repeating lookups. It does not verify caller-retained records or the truth of the host's judgment.

The skill loads reporting guidance only for requested report preparation. Reporting still requires host research and approval under ADR 0015. A skill makes the workflow discoverable, not compulsory. Package tests establish executable and resource resolution outside the checkout; host discovery remains dependent on correct installation and the host's behavior. The CLI never calls a model. A general-purpose host invoking it already uses inference, so this is not a promise of zero host tokens.
