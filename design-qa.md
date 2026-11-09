# Notice design QA

- Source visual truth: `C:/Users/user/.codex/generated_images/01a1b6b9-e9b9-7d91-bda6-730c3c072226/exec-70d05717-fa6f-4b13-941c-d5dac41b225a.png` (1536 × 1024 board, selected first design with the home all-notices link removed).
- Implementation: `http://localhost:3001/`, `/notices/104`, `/admin/notices`; final production build with an isolated in-memory QA backend. No production notice writes.
- Viewport: 390 × 844 CSS pixels, DPR 1. Detail/admin rasters are 390 × 844. The browser returns a 375 × 812 home raster for the same DOM viewport; it is proportionally normalized to 390 × 844 for comparison. Source panels are approximately 421–422 × 884 pixels, cropped from the board and scaled proportionally to 390px width without stretching the UI.
- Implementation screenshots: `home-mobile.png`, `detail-mobile.png`, `admin-mobile.png` in `C:/Users/user/.codex/visualizations/2026/11/07/01a1b6b9-e9b9-7d91-bda6-730c3c072226/notice-design/`.
- Full-view comparison: `comparison-final.png` in the same directory, source and final implementation combined in one image.
- Focused comparison: `comparison-focus.png`, comparing the notice bar, admin header alignment and footer actions side by side.

## Findings

- No remaining actionable P0/P1/P2 findings in the final comparison.
- Corrected notice detail/admin header alignment, home-only header and D-Day spacing, and the larger bold publish action label.

## Required fidelity surfaces

- Typography: existing Pretendard and 16px mobile form input sizes retained. Notice heading hierarchy, labels and body line spacing follow the target; the publish action uses a 20px bold label. The API stores plain text, so sample inline bold formatting is not converted to HTML.
- Spacing: 24px article/form gutters, compact 48px notice row, 64px D-Day row, home-only compact header, and fixed bottom form actions. No nested content cards or clipped controls in the final mobile captures.
- Colors: existing coral primary, pale coral notice surface, neutral body/secondary text; no new palette. Browser computed primary color is `rgb(255, 67, 46)`; native screenshot color rendering is not compensated by changing product tokens.
- Assets: existing Pillchat logo, back/bottom-nav assets; installed Lucide megaphone and chevron icons. No generated raster replacements or hand-drawn assets.
- Copy: notice content is server/draft text; only labels and helper text are fixed. The home all-notices link is absent as requested.

## Interaction evidence

- Local login, home notice → detail → list navigation verified in-browser.
- Admin draft → preview → edit preserves content and checkbox state.
- Publishing with home visibility disabled returns `/notices/102` and preserves the published content.
- Publishing with home visibility enabled returns `/notices/103`, and the home banner links to that new ID. The final production build was also exercised through a successful creation and home link to `/notices/104`.
- 320px home/editor and 1440px home layouts were inspected without horizontal overflow. Fixed editor actions measured 48px high. The final 390px captures verify the subsequent spacing and action-label refinements.
- Latest browser console inspection returned no error entries. The existing external national-exam lookup may fail in the restricted QA network; its fallback date remains visible and this is outside notice functionality.
- Unit checks cover validation, malformed receipts, server denial, cache isolation, no automatic mutation retries, draft preservation and duplicate submission prevention.
- All 344 tests pass; final production build and TypeScript checks pass.

## Comparison history

1. Initial comparison found header alignment drift and a home raster/DOM size mismatch. The latter was confirmed as browser capture scaling and normalized rather than treated as a product font defect.
2. A normalized full-view comparison confirmed the corrected left-aligned notice headers. Existing home header/D-Day padding still pushed study sections below their target positions. Home-only compact header spacing and a 64px D-Day row correct that drift; the publish action now uses the reference's larger bold label.
3. Final production-build captures were compared together with the reference in `comparison-final.png` and `comparison-focus.png`. Corrected hierarchy, spacing and actions pass; the requested home all-notices link is absent.

## Implementation checklist

- [x] Home pinned notice bar before D-Day, with no all-notices link.
- [x] Detail reading view and list return.
- [x] Admin entry, server authorization, title/body editing, home visibility, preview and publication.
- [x] Failed drafts retained; retries are manual; duplicate submissions remain locked through successful navigation.
- [x] Existing notice API contract reused; no extra dependencies, production publications, commits or deployments.

## Follow-up polish

- P3: Generated mock body emphasis is illustrative. Published and preview body content remains escaped plain text, matching the existing API and textarea input.
- Live production publication and real iOS keyboard behavior were not exercised.

final result: passed
