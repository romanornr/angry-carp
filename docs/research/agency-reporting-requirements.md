# Agency reporting requirements

Checked 2026-09-21. This note covers public guidance from CIA, FBI and IC3, and NSA. It supports portable phishing-report drafts in Angry Carp. No reports were submitted, and no suspected phishing sites were visited.

The sources support an IC3 crime-complaint draft. They do not support sending every phishing finding to CIA or NSA. None of the checked agencies documents a general provider-takedown email template. That is a finding about the sources checked, not proof that no other reporting arrangement exists.

## Reporting purpose and fit

| Recipient | Documented purpose | Fit for Angry Carp |
| --- | --- | --- |
| FBI through IC3 | Public cyber-enabled crime complaints. FBI explicitly directs spoofing and phishing reports to IC3. | An optional crime-report destination, separate from a provider abuse request. [FBI phishing guidance](https://www.fbi.gov/how-we-can-help-you/common-frauds-and-scams/spoofing-and-phishing) |
| CIA | Information that supports foreign intelligence collection. CIA says it does not conduct law enforcement. | No ordinary phishing or provider-takedown destination established by the checked guidance. [CIA reporting guidance](https://www.cia.gov/report-information) |
| NSA | Cybersecurity for national security systems and the Defense Industrial Base, with industry partnerships. | No general public phishing-takedown intake established by the checked pages. [NSA mission](https://www.nsa.gov/), [Collaboration Center](https://www.nsa.gov/About/Cybersecurity-Collaboration-Center/) |

The joint CISA, NSA, FBI, and MS-ISAC phishing guide directs phishing attempts and victim reports to IC3 or a local FBI field office. It also recommends providers' reporting features. Its reporting section does not name an NSA phishing inbox. The guide's TLP:CLEAR label applies to that published guide, not to evidence collected by Angry Carp. [Joint guide, pages 1 and 12](https://www.ic3.gov/CSA/2023/231018.pdf)

## FBI and IC3

### Channel and official form

The official artifact is the [IC3 complaint form](https://complaint.ic3.gov/). Its sections cover the filer, affected person or business, transactions, subjects, incident description, other information, and privacy and signature. The extracted form marks identity and contact fields as required, with further fields dependent on the selected answers. A typed full name affirms accuracy and acts as a signature. It warns against supplying Social Security numbers or dates of birth.

The form's text limits are 3,500 characters for the incident narrative, 5,000 for technical details, 1,000 for other witnesses or affected people, and 1,000 for prior agency reports. Technical details can include email headers. Subject fields include email, website or social account, and IP address. Unknown subjects can be skipped. Transaction details apply where relevant. These observations come from the publicly readable form; conditional validation was not tested. [Official form](https://complaint.ic3.gov/)

### Evidence and handling

IC3 accepts complaints from affected people in other countries and reports on another person's behalf. It asks for accurate incident details, available subject identifiers, applicable financial information, and email headers. It has no spam-forwarding email address and accepts no attachments. Complainants can paste email contents and headers and must retain originals securely. Evidence examples include emails, web pages, logs, network captures, and financial records. [IC3 FAQ](https://www.ic3.gov/Home/FAQ)

IC3 reviews and refers complaints. Receiving agencies decide whether to investigate. IC3 does not provide investigation updates or promise takedown. Complaints cannot be canceled. Updates require a new complaint referring to the earlier report. The confirmation page is the opportunity to save a copy. [IC3 FAQ](https://www.ic3.gov/Home/FAQ)

### Privacy and public disclosure

The FBI retains complaint data and may refer it to domestic or foreign enforcement and regulatory agencies. It may share relevant information with private partners to obtain investigative assistance. It generally withholds complainant identifiers from those partners unless reasonably necessary. IC3 expressly cannot guarantee confidentiality because state laws differ. Even data from incomplete complaints may be retained. The site logs connection and visit information. [IC3 privacy policy](https://www.ic3.gov/Home/Privacy)

Design implication: an IC3 draft needs a recipient-specific disclosure preview and explicit human approval. A reusable report must not silently include a portable user's identity or sign on their behalf. IC3 submission is a separate event from sending a provider abuse email.

## CIA

The [reporting page](https://www.cia.gov/report-information) describes online reporting, a Tor site, postal mail, and delivery through a U.S. embassy or consulate. It suggests personal and biographic details only if the sender considers it safe. It also asks how the information was obtained and how the sender can be contacted. These are intelligence-source suggestions, not mandatory phishing evidence fields.

CIA says internet communications carry risk and does not guarantee a response. It says it works to protect submitted information and identity. Its [privacy policy](https://www.cia.gov/privacy_policy/) separately states that information offered for its mission may be checked and shared with appropriate entities for authorized responsibilities. Submission consents to that use. Website connection and visit metadata may be collected.

The checked page establishes an official reporting entry point but did not expose a separate phishing form, required phishing schema, attachment specification, or abuse-email template in the fetched content. Design implication: CIA should remain an exceptional, manually selected intelligence destination with a documented reason. Routine findings do not establish that reason. No automatic collection of passport or other biographic material follows from this research.

## NSA

The [Cybersecurity Collaboration Center](https://www.nsa.gov/About/Cybersecurity-Collaboration-Center/) describes partnerships focused on the Defense Industrial Base, nation-state threats, and sensitive networks. Its [customer contact form](https://www.nsa.gov/about/cybersecurity-collaboration-center/customer-contact-form/) requires name, email, phone, organization, message, and primary concern, plus reCAPTCHA. The fetched form did not document phishing evidence fields, attachments, or a public-disclosure rule.

Joint incident guidance identifies `Cybersecurity_Requests@nsa.gov` for NSA client requirements or general cybersecurity inquiries. It separately directs suspicious activity to FBI or IC3. This does not establish the NSA address as a provider-abuse or takedown inbox. [Joint communications-infrastructure guidance](https://www.cisa.gov/resources-tools/resources/enhanced-visibility-and-hardening-guidance-communications-infrastructure)

NSA's OIG hotline concerns misconduct in NSA programs or by NSA personnel, contractors, and assigned military. It is not a general internet fraud reporting route. [NSA OIG hotline](https://oig.nsa.gov/OIG-Hotline/)

### A vulnerability report is a separate report type

NSA's Ghidra project provides a concrete official vulnerability process. It asks for private GitHub reporting, a summary, affected files and lines, reproduction or proof of concept, impact, and an optional fix. It forbids public vulnerability issues. Triage comments remain private, but an advisory may become public after a patched release. These rules concern Ghidra vulnerabilities, not phishing pages or all NSA reporting. [Ghidra security policy](https://github.com/NationalSecurityAgency/ghidra/blob/master/SECURITY.md)

The checked NSA sources did not establish a universal agency vulnerability form or phishing abuse template. NSA's publication of vulnerability-disclosure guidance for suppliers does not itself make NSA the recipient for vulnerabilities in arbitrary third-party systems. [NSA disclosure-guidance announcement](https://www.nsa.gov/Press-Room/Press-Releases-Statements/Press-Release-View/Article/4546549/nsa-joins-cisa-and-others-in-releasing-the-cybersecurity-information-sheet-esta/)

## Consequences for portable report design

These are design conclusions from the sources above, not agency specifications.

- Keep provider abuse, public crime complaints, intelligence tips, and product vulnerability disclosures as separate recipient purposes.
- Store reusable observations separately from recipient identity, consent, signatures, and attachments. Preserve original evidence locally while generating a text-only IC3 draft.
- Record the reporting instructions' URL and checked date beside each recipient profile. Distinguish required fields from requested evidence and unverified form behavior.
- Require initial approval for every report, showing its exact recipient, purpose, text, disclosed identity, attachments, and source-backed handling caveats.
- Treat report acceptance, investigation, and takedown as different outcomes. No source checked promises that a submission will remove a site.

## Research limits

All citations above are checked official sources or an official NSA project policy. The FBI page was available through the search index but direct page extraction failed; the joint guide independently confirms its IC3 routing. The CIA reporting link returned the reporting page, so this note makes no claim about hidden form validation. An attempted NSA general contact URL returned an extraction error; the linked Collaboration Center form was readable. No form was completed, and no attachment upload, CAPTCHA, signature, or submission flow was tested. No public submission API or agency-provided phishing email template was found in the checked sources. Partner-only channels and unpublished arrangements remain outside this review.
