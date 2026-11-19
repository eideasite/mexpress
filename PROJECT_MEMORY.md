# Project Memory

Last updated: 2026-11-17

## App

- Jeyamohan Articles is a Vue 3 + Vite single-page writing workspace using Vue Router and Lucide Vue icons.
- Browser storage formats and keys remain in `src/services`; the React UI, React dependencies, and Ant Design React have been removed.
- Articles, bookmarks, Home Shortcuts, highlights, profile preferences, and local publish/schedule states remain in `localStorage`; posts and images use IndexedDB plus a timestamped `localStorage` recovery cache. The app requests persistent browser storage on startup where supported, but browser/site-data resets and device loss can still erase local data. There is no backend or cross-device sync.
- Article edits and profile fields save synchronously to localStorage as they change; unfinished post text is written to a dedicated localStorage draft key on every keystroke and restored when opening the post composer after refresh.
- Profile settings display the browser-reported storage usage, quota, and estimated remaining capacity; the estimate is origin-wide/browser-controlled, not a guaranteed 3,487 MB allocation.
- The Backup route exports local articles, posts/images, highlights, bookmarks, drafts, and preferences as date-organized ZIP parts capped below 387,000,000 bytes. Restore merges new IDs and keeps existing content/preferences; individual TXT and PNG/JPEG/GIF/WebP files import as Home posts. Multi-selected posts can be downloaded as date-organized ZIP archives. Google Drive upload remains manual; the app has no backend.
- Article Editor focus mode hides navigation/status chrome, expands the editor, and persists its state in the browser. The current development browser is left with focus mode enabled.
- Action groups place secondary actions left and main actions right (for groups with four or more, the last two are right-aligned); notifications appear centered near the top. Post creation persists before clearing the composer and confirms as soon as browser storage commits.
- Vite dev server is pinned to `127.0.0.1:5173` (strict port) so silently changing origin/port does not make local posts appear missing; use the same URL on each run.
- The desktop/mobile global Google search offers regular Google Search or Google Search AI Mode through a dropdown. The selected mode persists in this browser; the shared query is cleared only after the chosen search tab opens.
- The Privacy Policy route is `/privacy-policy`; its contact card links to the listed email, phone, and LinkedIn profile. The shared footer links to the policy and copies the contact site URL.
- Document language follows the persisted English/Tamil app selection; the tab favicon uses the Jeyamohan Tamil wordmark rather than the Vite starter icon.
- The Read Aloud controls have a mobile min-width fix so long system voice names do not cause horizontal page overflow.
- Posts created offline are saved on-device and marked sync-pending. No remote upload or automatic retry is attempted until an upload service is configured.
- The network indicator uses browser connection estimates and explicit speed-test results; browser APIs cannot read a device's cellular signal bars.
- Network quality colors are inferred from browser estimates or the manual download test: under 1 Mbps weak/blue, 1-<5 okay/red, 5-<25 good/yellow, and 25+ fast/green. Tapping the indicator opens details; the border animates while details are open or a test runs.
- On mobile, the network strip is now a compact single row (about 35 px tall); the measured Mbps result appears in a quality-colored badge beside the brand in the header.
- On the Home route, Google AI search moves below the network strip and above the Home heading on mobile; desktop keeps the search in the header. Mobile Highlights appear after the composer and before Recent Posts; desktop order is unchanged.
- Submitting an AI prompt on mobile (including Enter) asks the user to choose Gemini, ChatGPT, or Meta AI, then copies the exact prompt and opens that provider; desktop continues to open all three.
- The default profile display name is `Jeyamohan`. Only exact known legacy default names (including the garbled stored value) are normalized during workspace load; other profile names remain unchanged.
- Mobile non-Home routes show a back arrow beside the hamburger. It returns through Vue Router history, and replaces the route with Home when no in-app history exists. Permission prompts are not requested globally; browser permissions must be user-approved in response to a specific feature action.
- Vue state and debounced persistence are centralized in `src/stores/workspace.js`.
- The route hash continues to use familiar paths such as `#/compose` and `#/editor?article=...`.

## Verification

- `npm.cmd run lint`, `npm.cmd test`, and `npm.cmd run build` pass after the backup feature changes.
- Browser smoke check covered article creation, autosave to the existing workspace key, local publishing, and responsive widths from 320 px to desktop; smoke-test storage was restored afterward.
- Network status panel, quality color, animated border, and mobile overflow were checked. Offline post smoke check confirmed an IndexedDB post persisted through reload and stayed marked sync-pending; temporary test data was restored.
- The compact network strip and header speed badge were verified in the mobile browser: strip height decreased from about 60 px to 35 px, the speed test showed a quality-colored Mbps badge, and no content extended beyond the viewport at tested mobile widths.
- Mobile/desktop layout checks confirmed the Google AI search and Highlights are in the intended responsive positions at 375 px and desktop width; browser storage now shows the migrated profile name `Jeyamohan`.
- Backup route browser smoke checks confirmed ZIP download initiation, TXT import into the Home post feed, and no horizontal overflow at 375 px. A temporary imported test post was removed afterward.
- Focus mode browser check confirmed navigation/header hiding, an available exit control, and persistence after page refresh.
- Mobile back navigation was browser-tested from Profile to Home; the menu remains available and the back control is hidden on Home. Build passes and targeted ESLint reports 0 errors (8 existing Vue style warnings).
- The dev server was last started at `http://127.0.0.1:5173/`; check whether it is running before assuming it is available.

## GitHub Pages Deployment

- The target repository is `eideasite/onetwo`, branch `main`; the app is nested under `jeyamohanarticles`.
- `.github/workflows/deploy-pages.yml` builds with `--base=/onetwo/`, runs lint, uploads the `dist` artifact, and deploys to GitHub Pages. It runs on relevant pushes to `main` and supports manual dispatch.
- The root README links to `https://eideasite.github.io/onetwo/`.
- The latest `onetwo/main` commit is `d27d8c8` (`Enable GitHub Pages for the repository`); the local branch is `feature/article-improvements`, four commits ahead of `origin/feature/article-improvements`.
- The latest confirmed workflow run (#2, for `d27d8c8`) failed in `actions/configure-pages` with `Resource not accessible by integration` while trying to create the Pages site. Earlier lint and a Pages-base production build passed.
- The user later reported selecting GitHub Actions as the Pages source, but that setting and a successful deployment were not independently verified. The published URL returned 404 before that report; deployment still needs a rerun and URL check.
- Next step: rerun `Deploy to GitHub Pages` from the repository Actions page (or use its `workflow_dispatch` trigger), then verify the site URL. Do not claim it is live until the workflow succeeds and the URL loads.

## Next Work (User Will Provide Changes One at a Time)

- Likely follow-ups from the user's backlog: date-grouped `/posts` grid/list view, date-wise TXT/JSON exports, post-copy action, mobile navigation/search polish, accessibility duplicate cleanup, and durable composer drafts.
- Do not implement the entire backlog at once; take the next requested item, clarify scope when needed, and preserve the dirty worktree.
- Google Drive/Gmail sync and a 3 GB cloud quota need a real backend and Google OAuth configuration; none is configured. Do not claim cloud upload or automatic retry.
- The Backup page surfaces a warning when browser-reported storage reaches 85% of quota; browser estimates are not exact and cannot guarantee a successful write.
- A webpage cannot configure OpenDNS or device DNS. A hard-coded default password such as `1234` is not safe for a real login.
