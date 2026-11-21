# Civix demo

Run `npm ci` and `npm run dev` from the project directory. For live triage, place the restricted demo credential in a local `.env` entry named `VITE_GEMINI_API_KEY` and restart Vite. Leaving the entry empty enables deterministic keyword triage. The production build command is `npm run build`.

## Two-minute walkthrough

| Time | Action and speaking notes |
|---|---|
| 0:00–0:15 | Citizens can describe a municipal problem in their own language. Officers need to know which complaint needs attention first. |
| 0:15–0:30 | Show the Officer Dashboard with eight demo tickets. Point out the reason under a Critical ticket and its responsible department. |
| 0:30–1:05 | Open Citizen Intake, paste the Kannada complaint below, and select the accompanying synthetic photo, hanging-wire.png. Submit. |
| 1:05–1:25 | Read the actual result. On the AI path, show the English summary, severity reason and photo observation. On the fallback path, point out the keyword estimate and manual-review flag. |
| 1:25–1:40 | Open the dashboard. Find the new ticket in its severity group. Older tickets in the same group stay ahead of it. |
| 1:40–1:55 | With the page loaded, disconnect the network and submit “A live wire is hanging near the bus stop.” Show the Critical keyword estimate, fallback banner and review flag. Restore the network. |
| 1:55–2:00 | In a pilot, measure the share of complaints reaching the correct department on first assignment against the municipality’s current baseline. |

**Sample Kannada complaint**

ನಿನ್ನೆ ರಾತ್ರಿ ಮಳೆ ಬಂದ ನಂತರ ಬಸ್ ನಿಲ್ದಾಣದ ಹತ್ತಿರ ಕಂಬದಿಂದ ವಿದ್ಯುತ್ ತಂತಿ ತುಂಬಾ ಕೆಳಗೆ ನೇತಾಡುತ್ತಿದೆ.

**Presentation note.** The photo is synthetic. Have fluent speakers review the regional-language examples before presenting. The live endpoint returned HTTP 404 during verification. Confirm access to the specified model before presenting a live AI result.

## Pilot pitch

Civix gives citizens a four-language intake form and officers a single priority queue. An officer can read the original report, inspect the photo and review the reason for each suggested priority. A municipal pilot would validate department routing with local officers and measure first-assignment accuracy. Scaling beyond one browser would require secure server-side credentials, shared ticket storage and integration with the municipality’s grievance system.
