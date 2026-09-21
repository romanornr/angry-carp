# Define defensible evidence and campaign claims

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Assignee: operator with Codex
Parent: ../map.md
Blocked by: 01, 02

## Question

What evidence justifies classification, reporting to each provider role, and linking messages into a suspected campaign? Define how observations, inferences, contrary evidence, and uncertainty differ. Specify what campaign activity means within the observed mailbox and external sources, without claiming total volume or common attacker identity from shared infrastructure alone.

Exercise the model against a legitimate signing request, a compromised legitimate sender, tracking links with unknown destinations, and repeated messages with different resource paths. Resolve when email evidence is sufficient and when missing evidence prevents a particular claim or reporting action.

## Comments

The operator accepted that email evidence alone can justify preparing an abuse report when it demonstrates the reported deception or sending abuse. A landing-page scan is not a universal prerequisite. Claims about website behavior require evidence for that behavior; every report still requires approval before sending.

The operator chose both mailbox history and existing external observations for activity research. Keep sources, observation periods, and counts separate. Mailbox message counts and external scan observations do not establish total campaign volume, victim counts, or a common attacker. Newly requested scans must not inflate counts presented as independent external sightings.

The operator accepted automatic provisional campaign links for strong repeat evidence, such as the same impersonation and specific resource across different senders. Preserve each original message and assessment, record the linkage reason, and allow correction. A shared IP, hosting provider, or impersonated brand alone is insufficient.

The operator accepted that unfamiliar senders, recent domain registration, and a document-signing request do not alone justify High confidence or an accusation. Preserve concrete unresolved concerns as Medium and ask a focused question. Ordinary unfamiliar mail remains Low.

## Answer

Prepare reports from the evidence that supports each claim. Email evidence can establish deceptive requests and sending abuse without a scan; website-specific claims require website-specific observations. Keep observations, inferences, uncertainty, and material contrary evidence distinct. Existing requirements to include material contrary evidence and avoid unsupported claims continue to apply.

Use mailbox history and existing external observations to investigate activity, with separate sources, time bounds, and counts. Do not infer global volume or common attacker identity from those counts, and do not count Angry Carp's requested scans as independent external sightings.

Create provisional campaign links automatically when strong matching evidence supports them, with the reason preserved and corrections possible. Shared infrastructure or brand alone does not suffice. Campaign membership does not replace assessment of each message or establish ownership of every linked resource.

High confidence requires defensible evidence of deception or malicious delivery. Preserve a concrete material ambiguity as Medium with a focused question for the operator; unfamiliarity alone remains Low. Claims about an unvisited landing page and a legitimate signing request cannot be settled by sender novelty or an authentication result alone.
