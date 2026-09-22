---
status: accepted
---

# Keep the workflow independent of tools and runtimes

Distribute Angry Carp's workflow and reporting instructions for useful guided investigation and drafting without requiring its CLI or a particular agent runtime. The operator chose this so people can use their existing agents and connectors. Host-specific packages draw from the same maintained instructions and reporting skill rather than develop independent report templates.

Reusable code owns case and reporting operations when installed. An optional local analyst runner uses those operations without taking ownership of their rules. This supports existing agents and a standalone runner at the cost of documenting different host capabilities. Each host must disclose missing capabilities and must not claim software-enforced controls, durable evidence, or complete acquisition that it cannot supply. The disclosure rules, direct-fetch prohibition, and report-approval requirements apply in every mode.

Implementation clarification, 2026-09-22: keep `phishing-triage.md` usable as a standalone download. Flue-specific tool contracts and runtime integration belong under `agent/`; algorithm explanations belong in user documentation. The shared instructions describe evidence handling without enumerating Flue tools or requiring TypeScript. This lets other agents apply the same assessment rules with their own capabilities. Any future catalogue lookup must follow this boundary instead of embedding a domain list or Flue invocation in the portable prompt.
