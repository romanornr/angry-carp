# Spamhaus submission and dataset options

Sources retrieved: 2026-09-23. Bounded future evaluation for angry-carp. No integration selected, accounts created, reports submitted, or candidate sites visited.

## Verified submission route

The [Threat Intel Community](https://submit.spamhaus.org/resources/who-is-the-threat-intel-community-for/) accepts ordinary users reporting spam or phishing and researchers contributing at scale. The [submission portal](https://submit.spamhaus.org/submit/) accepts raw email source, URLs, domains, and IP addresses. An account is required for both individual reports and multiple submissions through its API. Authentication uses GitHub, Google, or LinkedIn, with email verification.

The portal requires observations from the contributor's own resources or open sources, authorization to share the data, and proportionate disclosure. It excludes unsubstantiated third-party claims, confidential proprietary information, and unauthorized disclosures. Contributors concerned about sensitive personal information must not send it. Submission does not automatically cause a listing. These are threat-intelligence contributions, not a guaranteed takedown route. [Submission conditions](https://submit.spamhaus.org/submit/).

## Verified dataset options

The [Domain Blocklist](https://www.spamhaus.org/blocklists/domain-blocklist/) covers low-reputation domains associated with spam, phishing, fraud, and malware. It includes compromised legitimate domains and lists domains only, not IP addresses.

[ZEN](https://www.spamhaus.org/blocklists/zen-blocklist/) combines the SBL, CSS, XBL, and PBL IP lists. Its categories must remain distinguishable. [PBL](https://www.spamhaus.org/blocklists/policy-blocklist/) identifies IP ranges that should not send mail directly to recipient mail servers. A PBL match does not establish phishing, and Spamhaus warns against applying it to URL filtering.

Spamhaus offers DNS queries and subscription data feeds through rsync. Public DNSBL access is limited to low-volume, non-commercial use. [Access overview](https://www.spamhaus.org/faqs/dnsbl-usage/). The separate free DQS account terms require non-commercial small organizations or individuals, current contact details, and query volumes that do not consistently exceed 100,000 daily. Commercial or excessive use requires a subscription. [DQS fair-use policy](https://www.spamhaus.com/terms-of-use-fair-use-policy-for-free-data-query-service/).

## Recommendation and open questions

Evaluate a manual submission route first, then DBL as additional domain-reputation evidence. Preserve the dataset, category, and observation time. Absence from a list must not become a safe verdict.

Not verified here: submission rate limits, payload limits, response guarantees, pricing, redistribution rights, offline snapshot permissions, and angry-carp's eligibility for free access. Those need review before automation or bundled datasets. No API implementation behavior or detection accuracy was tested.
