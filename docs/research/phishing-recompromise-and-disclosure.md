# Phishing recompromise and public disclosure

Research date: 2026-09-23. This note checks two Moore and Clayton papers and develops proposals for legitimate provider reports. It supplements [the takedown research](phishing-takedown-disruption.md).

## The 2011 estimate concerns compromised hosts

[The Impact of Public Information on Phishing Attack and Defense](https://www.sipa.columbia.edu/sites/default/files/2022-11/Cyber_Workshop_CS81_w.pdf#page=45), *Communications & Strategies* 81, first quarter 2011, studies 100,735 compromised hosts first observed from October 2007 through November 2008, followed through October 2010. Survival analysis estimates 17% recompromise within one year. This is a historical host-level estimate, not today's risk for every phishing URL.

PhishTank listed 59,593 hosts at their first reported compromise and missed 41,142. Recompromise was 8% versus 11% after one month. See "PhishTank and recompromise," pp. 60–62, Figure 4.

The comparison is observational. The authors propose wider defender awareness through free information. They did not measure reputational pressure, patch installation, or offender fear. Public visibility causing operators to patch is therefore an interpretation, not an established mechanism.

Recompromise meant reports at least seven days apart, rather than verified cleanup followed by intrusion. See pp. 56–57 and 61.

## The 2009 estimate uses different data and methods

[Evil Searching: Compromise and Recompromise of Internet Hosts for Phishing](https://www.cl.cam.ac.uk/~rnc1/fc09evil.pdf), Financial Cryptography 2009, reports 19% at 24 weeks for the 36,514-host phishing-feed comparison group. Its separate 1,320-host Webalizer sample reached 33%. Observations cover October 2007 through March 2008. Four-week intervals address unequal observation time. See §4.2, pp. 9–10, Figure 3.

The public-list comparison includes 9,283 initially listed hosts and 15,398 initially missed hosts. Four-week recompromise was 8.9% versus 10.2%. Differences were statistically significant through 12 weeks but indistinguishable at 16–24 weeks. The authors suggest that freely available information reaches more defenders. See §5, pp. 12–13, Figure 5.

These estimates cannot form one time series: the later paper expands the cohort and follow-up and uses survival analysis. Neither comparison randomly assigns disclosure.

## Proposals for Angry Carp

These are product judgments, not measured effects of Angry Carp:

- For a suspected compromised legitimate site, a provider report could ask for removal of the phishing content and investigation of the underlying compromise. The report should distinguish observed evidence from an unverified cause.
- A repeat report could include the earlier case reference and dated evidence already available. Reappearance alone does not prove that the provider previously fixed the intrusion.
- The planned case records could distinguish report submission, provider acknowledgment, reported remediation, and later recurrence. Missing follow-up means an unknown outcome.

These proposals fit private provider reporting using supplied evidence. They require no visits to candidate sites, public accusation lists, or new runtime. The useful hypothesis is that better information helps providers remediate compromise. Measuring whether that happens would require outcome evidence beyond report counts.
