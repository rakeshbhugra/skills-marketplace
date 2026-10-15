# Fitting the video to the product

The engine does not care what the product is. The story, the tone, the mock apps and the rules about data and claims do. Find the product's domain first, then use the matching notes. Mix them when a product spans two.

## Every product

- **The main character is the person the product serves.** Name their role in the story bible: a sales rep, a radiologist, a care coordinator, a developer, a shopper, a finance analyst.
- **The story arc:** their problem today → the moment the product steps in → the result they get. Every scene should move that person forward.
- **The tone matches the audience.** A launch promo for marketers can be bold and fast. A clinical tool for doctors should be calm, precise and unhurried. A developer tool should show real code and real terminal output.
- **Mock third-party apps** come from the user's real day: what they switch to before and after the product. Build those as mock screens (see the step contract), never with real logos.

## B2B sales and marketing tools

- **Cast:** buyer, account, sales rep, marketer.
- **Typical mocks:** LinkedIn, Gmail or Outlook, Google search, ChatGPT answers, Slack, Teams, Salesforce or HubSpot, calendar.
- **Data:** invent companies and people. Never show a real, identifiable person being tracked or scored.
- **Claims:** watch for features the product does not have (automated "next best action", suggested replies). Watch for "#1" or "fastest" without numbers that show it.

## Healthcare and clinical products

- **Cast:** patient, clinician (radiologist, pulmonologist, nurse navigator, care coordinator), hospital admin.
- **Typical mocks:** an EHR-like record screen, a PACS or DICOM viewer, a scheduling calendar, patient SMS or WhatsApp messages, a referral letter or fax, a tumour-board list.
- **Patient data is never real.** Use only synthetic patients:
  - Invented names, made-up MRNs and IDs, and plausible but invented dates of birth.
  - Medical images only from the product's own demo or synthetic set, or from public de-identified datasets the team already uses.
  - Capturing from a test environment: confirm with the person that its patients are synthetic before capturing. If unsure, blur or replace names, IDs, dates of birth, addresses and faces in every frame.
  - Never record a production environment.
- **Clinical and regulatory claims must come word for word from approved material:** accuracy, sensitivity, time saved, "FDA cleared" or "CE marked", "detects cancer", outcomes. Do not round, combine or paraphrase them into something stronger. When there is no approved source, leave the claim out.
- **Language:** say "flags", "prioritises" and "supports the clinician". Never say "diagnoses" or "decides" unless the approved material says so. The clinician stays in charge in every scene.
- **Tone:** calm, clear, respectful of patients. No hype and no alarm-red emergencies for effect. Use the clinical colour language the product already uses (for example, its own urgency colours).

## Developer tools and infrastructure

- **Cast:** developer, SRE, platform team.
- **Typical mocks:** an editor, a terminal, a GitHub pull request, CI logs, a dashboard, Slack.
- **Code:** show real, runnable code from the product's docs, and real CLI output. Developers spot fake code instantly.
- **Claims:** benchmarks only with the setup they were measured on.

## Fintech and regulated finance

- **Cast:** analyst, controller, end customer.
- **Typical mocks:** a bank or ERP screen, spreadsheets, approval emails, statements.
- **Data:** invented accounts and amounts. No real card numbers, IBANs or customer names, even partially masked.
- **Claims:** returns, savings and compliance statements only from approved material.

## Consumer apps

- **Cast:** the end user in a real moment of their day.
- **Format:** often wanted as vertical (9:16). The engine is built for 16:9 at 1920×1080. For vertical, render 16:9 and crop a centred 9:16 window with ffmpeg, keeping key content in the middle third. Or change the sizes in `engine.js`, `index.html`, `still.mjs` and `render.mjs` together.
- **Typical mocks:** phone notifications, messaging apps, the app store page.
- **Data:** invented people, invented photos (or none), invented locations.
