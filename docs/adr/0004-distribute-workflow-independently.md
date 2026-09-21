---
status: accepted
---

# Keep the workflow independent of tools and runtimes

Distribute Angry Carp's workflow and reporting instructions for useful guided investigation and drafting without requiring its CLI or a particular agent runtime. The operator chose this so people can use their existing agents and connectors. Host-specific packages draw from the same maintained instructions and reporting skill rather than develop independent report templates.

Reusable code owns case and reporting operations when installed. An optional local analyst runner uses those operations without taking ownership of their rules. This supports existing agents and a standalone runner at the cost of documenting different host capabilities. Downloaded instructions must state missing capabilities and must not claim software-enforced controls, durable evidence, or complete acquisition that the host cannot supply. The disclosure rules, direct-fetch prohibition, and report-approval requirements apply in every mode.
