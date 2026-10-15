# Capturing real product screens

Real product screens are the strongest material, and there are two ways to get them. Pick by what the repo already has. Never record a production environment.

## Option A: sign in to a test environment the team already uses

Many repos already sign in to a staging or alpha environment for their own end-to-end tests. Look for:
- a `journeys/` or `e2e/` folder;
- a `login.mjs`-style script;
- a saved Playwright `storageState` (`.auth/state.json`);
- a Playwright config;
- notes in CLAUDE.md or the README.

If one exists, reuse it:

1. **The person signs in by hand.** Run the repo's own login script, which opens a real browser and saves the session. Never type, store or ask for their password yourself. If no such script exists, write a small one: a persistent Playwright context, headful, that saves `storageState` every few seconds until the window is closed.
2. **Capture with the saved session:** `browser.newContext({ storageState: "<path>/state.json" })`, then screenshot as below. Sessions expire, so if pages bounce to a login screen, ask the person to run the login script again.
3. **Run the local dev server against that environment** if the repo's `.env.local` already points at it. You get the newest UI with real test data.
4. **Check the data before capturing.** Test environments often hold copies of real records. Ask the person whether the data there is synthetic. If it is not certain, cover every name, ID, date of birth, address, phone number, email and face before it reaches a frame. Override the text in the page with `page.evaluate` (swap in invented values), or blur those regions in the screenshot. Healthcare and finance products need this every time (see `domains.md`).

## Option B: run the app against a fake backend

When there is no test environment, or it cannot be reached, fake the backend:

0. Do not use production credentials, and do not point the video at production.
1. **Find what the frontend calls.** Grep for the API base URL env var and the endpoints the target pages fetch (auth, user profile, the page's data). Look for bundled demo or mock data in the repo (`mockData`, `data/demo`, fixtures). Apps often ship it.
2. **Write a tiny fake backend** with the Python standard library (`http.server`). Return a fake user for the auth endpoints, the demo data for the page's endpoint, and `[]` for anything else. The first run's version was about 30 lines.
3. **CORS:** echo the request's `Origin` and `Access-Control-Request-Headers`, and allow credentials. A wildcard `*` for headers does not work with credentials, and the login check fails silently.
4. **Start the dev server** with the API URL env var pointing at the fake backend (`NEXT_PUBLIC_API_URL=http://localhost:8766 yarn dev -p 3100`). Process env beats `.env.local` in Next.js.
5. **Add a fake `token` cookie** in Playwright (`context.addCookies`) so auth middleware lets you in.
6. **Allow the pages:** if middleware checks a list of allowed pages from the backend, return every route prefix you need.

## Make the screens look right

- **Freeze the clock** to match the demo data, or date-filtered pages show "no data in this range": `await page.clock.setFixedTime(new Date("2026-05-20T15:00:00Z"))`.
- **Hide dev overlays**, e.g. the Next.js issue badge: inject `nextjs-portal{display:none!important}` with `addInitScript`.
- **Fill the user name.** "undefined undefined" in the header means a profile endpoint is missing a field. Add it to the fake backend.
- **Capture at 2x** (`deviceScaleFactor: 2`) so zoomed-in shots stay sharp. Take tall captures (viewport height 2500) to pan down long pages.
- **Waiting:** pages that poll never reach `networkidle`. Use `waitUntil: "load"` plus a fixed wait.
- **Empty pages:** if a page needs data you cannot fake cheaply, build that screen as a mock in the app's style instead. Reuse the app chrome (sidebar, top bar, colours) so it still looks like the product.
- **Assets:** copy logos and icons from the repo's `public/` folder rather than cropping screenshots, because crops are blurry.

## Screen recording a walkthrough

- `browser.newContext({ recordVideo: { dir, size } })`, then drive the page with `page.mouse.move(x, y, { steps: 30 })` for smooth motion.
- **Fake cursor:** inject one with `addInitScript`. It is a fixed div that follows `mousemove`, shrinks on `mousedown`, and adds a fading ripple at the click point. Store its last position in `sessionStorage` so it does not jump on navigation.
- **Scroll** with small `mouse.wheel` steps while the mouse is over plain page content. Over a chart, the wheel can be swallowed.
- **Grey strip:** Playwright's video often has a grey band at the bottom. Crop it with ffmpeg (`crop=1600:910:0:0`) and trim the first second of loading.
- **Clicking:** prefer `getByText("Exact label", { exact: true })` over guessing ARIA roles. Buttons are often links.
