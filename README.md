# Jeyamohan Articles

Vue 3 + Vite writing workspace with Vue Router and Lucide Vue icons.

## Start

```sh
npm.cmd run dev
```

Open the app at `http://127.0.0.1:5173/`. The dev server uses a fixed origin so Vite cannot silently switch ports and make browser storage appear empty. Keep using this same URL; `localhost`, a different port, or a deployed site has separate browser storage.

## Checks

```sh
npm.cmd run lint
npm.cmd run build
```

## Local-only behavior

- Profiles, drafts, bookmarks, Home Shortcuts, highlights, article status, SEO fields, and scheduled times are stored in this browser's `localStorage`. Posts and attached images use IndexedDB plus a timestamped `localStorage` recovery cache; post creation writes the cache immediately and commits the IndexedDB snapshot before reporting success. Legacy post data is merged and recovered on startup.
- Article edits and profile fields are saved to browser storage immediately as you type; unfinished post text is also saved on each keystroke and restored when the post composer is reopened after a refresh.
- On startup, the app requests persistent browser storage where supported and shows whether the browser granted protection from automatic storage cleanup. Data remains local to this browser/device; browser resets, clearing site data, uninstalling the browser, device loss, and unsupported browsers can still result in data loss. Download backups and keep them elsewhere.
- Profile settings show the browser's estimated origin storage usage, quota, and remaining capacity where the Storage API is supported. These estimates are browser-controlled and are not a reserved 3,487 MB backup quota.
- The Backup page exports articles, posts/images, highlights, bookmarks, drafts, and saved preferences into date-organized ZIP parts under 387 MB each. Restore merges new IDs and leaves existing content intact. Multiple posts can be selected and downloaded as a ZIP; ZIP backups and individual TXT/image files can be imported, with standalone files added to Home as posts.
- The Article Editor's focus mode hides navigation and status chrome, widens the writing area, and saves its on/off preference in this browser.
- Backup downloads are local and manual: upload the downloaded ZIP to Google Drive yourself. The website has no backend or Drive integration. Browser storage nearing its reported quota is flagged on the Backup page; the estimate is not a guarantee of how much data can be saved.
- Action groups place secondary actions on the left and the main action(s) on the right; app notifications appear centered near the top of the screen. New posts are written to the recovery cache immediately and the composer clears only after IndexedDB or the browser cache confirms the save.
- The app font preference (Inter, Times New Roman, Arial, or Open Sans) is saved in this browser. Inter and Open Sans are bundled locally; Tamil text uses available device/browser fonts.
- Posts created while offline are saved on this device and marked as sync pending. There is no upload server configured, so they are not sent or automatically retried to a remote service.
- The legacy writer draft (`ezhuthu-draft-v1`) remains supported and is not deleted during loading.
- Publishing and scheduling only change local article status. They do not publish or schedule work on an external service.
- SEO settings are a local preview; article text can be copied or downloaded as `.txt`.
- The Multi-AI Search page saves its prompt in this browser. It opens Gemini, ChatGPT, and Meta AI and copies the prompt. With the packaged browser helper installed, the prompt is filled and submitted in each provider tab; without it, paste and send it manually. Posts and article drafts are not sent.
- The global Google search opens either regular Google Search or Google Search AI Mode, selected from its dropdown. The selected mode is saved in this browser; the query is cleared only after the browser opens the chosen search tab.
- The header shows a 24-hour local clock and browser connectivity state. Network quality is inferred from browser estimates or the manual speed test; websites cannot read the device's cellular signal bars. The speed test downloads a sample from Cloudflare; article text is not sent.

There is no backend or configured external publishing, scheduling, or analytics integration.

## Responsive layout

The interface adapts from phone widths through tablet and desktop layouts, including safe-area insets, a mobile navigation drawer, and reduced-motion preferences. Use Chrome DevTools' device toolbar to check device presets; the website cannot control Chrome's device-toolbar settings or the phone's native status bar.

The codebase uses Vue single-file components; React, Ant Design React, and their runtime packages have been removed.

## Non-functional requirements

This README documents **10 non-functional requirement areas** for the application:

1. **Responsive layout:** Home, editor, dialogs, menus, and navigation must fit phone, tablet, and desktop viewports, including safe-area insets.
2. **Accessibility:** Controls must have accessible names and visible keyboard focus. Reduced-motion settings and the app's text-size, font, bold, and outline preferences must be respected.
3. **Local-first privacy:** Writing stays in browser storage. Only a query or prompt the user chooses to submit is sent to Google AI Mode or selected external AI providers; article and post content is not sent by the app.
4. **Offline behavior:** Local writing and post creation remain available offline, and offline posts are marked as pending because no upload service is configured.
5. **Data durability:** Drafts save locally, posts use IndexedDB with a timestamped local-storage recovery cache, and browser storage persistence is requested where supported.
6. **Data recovery:** Full backups and selected-post archives must be downloadable. Restore must validate supported files and merge new IDs without replacing existing content.
7. **Storage transparency:** Usage, quota, and estimated available browser storage must be shown when the browser supports the Storage API; estimates must be described as estimates, not device RAM or guaranteed capacity.
8. **Graceful compatibility:** Unsupported storage estimates, speech synthesis, clipboard, or browser APIs must produce a fallback or clear status instead of breaking the writing workspace.
9. **Localization:** English and Tamil labels must remain usable across navigation, editor, settings, and backup flows.
10. **Maintainability and documentation:** The Vue/Vite structure, local-only behavior, run commands, and verification scenarios must be documented in this README.

## Smoke-test cases

These cases describe expected end-to-end behavior. `npm test` runs the Node test suite; Playwright scenarios are run in an isolated browser context so they do not alter a user's saved workspace.

| ID | Scenario | Expected result |
| --- | --- | --- |
| TC-ROUTES-01 | Open Home, Profile, Article Editor, SEO, Published, Articles, Bookmarks, Archive, Backup, Multi-AI Search, Privacy Policy, and an unknown route at 375px and desktop width. | Each route shows its matching page or the not-found page; there is no horizontal overflow, uncaught browser exception, or console error. |
| TC-LOCALE-DOCUMENT-01 | Change the app language from English to Tamil and reload. | Page text and the root HTML `lang` value both change to Tamil and remain in sync after reload. |
| TC-POLICY-CONTACT-01 | Open the footer's Privacy Policy link, inspect contact actions, activate the contact URL copy icon, and return to Home with app navigation. | Policy route opens; email uses `mailto:`, phone uses `tel:`, LinkedIn opens the referenced profile, the copy button copies the site URL, and app navigation returns to Home. |
| TC-BOOKMARK-01 | Bookmark an article, reload, remove it, then permanently discard another bookmarked article. | Bookmark state persists, removal updates the list, and discarded articles are removed from bookmarks and Home Shortcuts. |
| TC-POST-EDIT-01 | Create a local post, open its three-dot menu, choose **Edit post**, change text, and save. Reload Home. | The updated text appears and persists; the separate unsent post draft is unchanged. |
| TC-POST-PERSIST-01 | In an isolated Playwright browser profile, create a uniquely named post, close the browser context, relaunch it with the same profile, and reopen Home. | The post remains visible in Recent Posts after the full browser restart; both the recovery cache and IndexedDB contain the saved post. |
| TC-POST-STORAGE-01 | Open a post's three-dot menu and choose **Check storage availability**. | The menu shows estimated available storage, used space, and quota, or a clear unsupported status. It identifies the figures as browser storage estimates, not device RAM. |
| TC-EDITOR-HISTORY-01 | Enter article text, select **Undo**, then select **Redo**. | Undo restores the previous body; Redo restores the edited body; both states autosave. Buttons are disabled when their respective history is empty. |
| TC-READ-ALOUD-01 | Open an article with text and use Play, Pause, Resume, and Stop; change voice and speech rate at mobile and desktop widths. | The title and plain-text body are read in order; controls update playback; changing article or leaving the editor stops speech; unsupported browsers show a clear message; voice and rate controls fit without horizontal overflow. |
| TC-ACCESSIBILITY-VISUAL-01 | In Profile > Additional Settings, enable high contrast, choose a colour filter, reduce blur, and toggle motion options; reload the app. | Each visual preference applies to the app, remains saved after reload, and reduced-motion settings suppress movement and animation. |
| TC-HIGHLIGHT-PREVIEW-01 | Tap a highlight collection card, then choose **Edit**. | The first action opens a read-only preview; only the explicit Edit action opens editable fields. |
| TC-AI-SEARCH-01 | Choose regular Google Search or AI Mode from the global search dropdown and submit on desktop and mobile. | One tab opens in the selected mode with the exact query; the selected mode persists in this browser. |
| TC-AI-TOOLS-01 | Submit a prompt from Multi-AI Search. | Gemini, ChatGPT, and Meta AI tabs open; the prompt is copied once. With the browser helper, the exact prompt is also sent in each provider tab. |
| TC-AI-HANDOFF-01 | Install the local browser helper, submit a prompt to one or all AI providers, then inspect each tab. | The prompt fragment is removed from the address bar, the provider composer receives the exact text, and Send is activated. If a provider UI changes, that tab reports a manual-paste fallback. |
| TC-AI-TOOLS-02 | In Playwright, make `navigator.clipboard.writeText()` stay pending, then submit a prompt from Multi-AI Search. | AI tabs navigate directly to provider URLs; the button stops loading within 2.5 seconds; any blocked tabs or clipboard failure are reported without closing tabs that did open. Capture a screenshot of the resulting status. |
| TC-BACKUP-RESTORE-01 | Download a full ZIP, import a valid ZIP, then import a TXT file. | Downloads use ZIP files; restore merges new records; TXT content appears as a local post; invalid input shows an error. |
| TC-OFFLINE-01 | Create a post while the browser is offline. | The post is saved locally and marked Sync pending. |
| TC-MOBILE-NAV-01 | At a 375px viewport, open the navigation drawer and choose Article Editor. | The drawer opens, navigation succeeds, and the drawer closes. |
| TC-STORAGE-01 | Refresh the storage estimate in Profile or Backup. | Usage and quota render when supported; unsupported browsers show a fallback message. |

## Software documentation

- **Application:** Vue 3 single-file components with Vue Router and Lucide Vue icons.
- **Build and development:** Vite. Start with `npm.cmd run dev`; run checks with `npm.cmd test`, `npm.cmd run lint`, and `npm.cmd run build`.
- **Data services:** `src/services/` contains browser storage, article/post persistence, AI launch, network speed test, and backup/restore code. `src/stores/workspace.js` coordinates shared workspace state.
- **Pages and routes:** `src/pages/WorkspacePage.vue` contains the writing workspace; `src/pages/BackupPage.vue` contains backup and restore; `src/router.js` lists application routes.
- **Known boundary:** Publishing and scheduling update local status only. No backend, remote sync, or Google Drive connection is configured.

## External AI prompt handoff

For automatic prompt filling and submission in Gemini, ChatGPT, and Meta AI, load the unpacked `browser-extension` folder in Chrome/Edge from the browser's Extensions page with Developer mode enabled. The app passes the prompt in a URL fragment; the extension removes it from the address bar before filling and submitting the provider composer. Without the helper installed, the app still opens provider tabs and copies the prompt for manual paste.

## Verification record

- Playwright smoke checks confirmed all 12 routes and the article editor, post creation, highlights, AI flows, offline status, backup actions, storage estimate, mobile navigation, focus mode, profile settings, local session controls, and the Privacy Policy footer/contact actions.
- Playwright confirmed the post three-dot menu can edit and persist a post without changing the separate unsent composer draft; its storage check shows estimated used, quota, and available space with a not-device-RAM note.
- Playwright confirmed Article Editor Undo restores the previous body and Redo restores the edited body.
- A Playwright ZIP/TXT restore check exposed and verified a shortcut-list merge bug fix in `src/stores/workspace.js`.
- Provider pages and the speed-test endpoint were stubbed in Playwright; no external AI prompt was sent.
- `npm test`: 3 passed. `npm.cmd run lint`: passed. `npm.cmd run build`: passed.
#   t h e w r i t e r 4  
 #   t h e w r i t e r 4  
 