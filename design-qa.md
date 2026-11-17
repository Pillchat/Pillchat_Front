# Student verification implementation QA

final result: passed

## Source and implementation evidence

- Source visual truth: the simplified design selected by the user, under design-previews/student-verification/screens/simple/.
- Source states: simple-index-html-state-empty-phone.png, simple-index-html-state-attached-phone.png, simple-admin-html-phone.png, simple-admin-html-tablet.png.
- Implementation: actual Next pages /student-verification and /admin/student-verifications.
- Implementation screenshots: design-previews/student-verification/screens/implementation/student-empty-phone.png, student-attached-phone.png, admin-phone.png, student-attached-tablet.png, admin-tablet.png, student-attached-desktop.png, admin-desktop.png.
- Full-view comparisons: comparison-student.png, comparison-admin-phone.png, comparison-admin-tablet.png in the same implementation directory. Each image contains both the selected source and rendered app.
- Viewports and raster dimensions: phone 390×844 CSS/image px, tablet 834×1112 CSS/image px, desktop 1440×900 CSS/image px. All DPR 1; no resizing, stretching or device chrome. The Next development indicator is hidden only by the QA harness.
- States: student empty/attached; administrator pending request, same fictional name/date/image. The generated sample is used only in design/QA fixtures, not in production seed data.
- Source and app controls, labels, metadata and image are readable at 1:1 in the combined phone/tablet comparisons, so a separate enlarged crop was not necessary.

## Findings and comparison history

1. [P2, fixed] The initial administrator approval label lost its white foreground, and the rejection label lost the intended size/weight. tailwind-merge interpreted the custom typography utility as a text color. The feature now uses standard text-xl/font-bold button utilities while preserving the shared Button foreground and disabled variants. No shared component was changed.
2. [P2, fixed] The administrator header initially included a back arrow absent from the selected minimal design. The final header matches the selected title-only layout.
3. Initial evidence: comparison-student-iteration1.png, comparison-admin-phone-iteration1.png, comparison-admin-tablet-iteration1.png. Final evidence: comparison-student.png, comparison-admin-phone.png, comparison-admin-tablet.png. No actionable P0/P1/P2 findings remain.
4. Screenshot normalization: initial attached-state captures caught the shared Button color transition immediately after enabling. Final capture waits for the steady coral state before comparison; the transition itself was not changed.

## Required fidelity surfaces

- Fonts/typography: existing local Pretendard; primary and review buttons are 20px/700, metadata 14px. Names and timestamps do not clip. The student page retains the existing shared CustomHeader typography (18px/600) as an intentional minor difference from the 20px design header.
- Spacing/layout rhythm: 24px gutters, 560px student form, 720px administrator content, 12px corners, fixed student action with safe-area padding and sufficient content clearance. Buttons retain the project standard 58px height versus 56px in the prototype. The shared student header is 60px versus the source's 56px mobile/64px tablet; this existing product convention is retained. These minor differences are accepted P3.
- Colors/tokens: existing coral HSL primary, white foreground, gray disabled state. Computed enabled button: rgb(255,67,46), white text. Disabled: rgb(237,237,237), rgb(153,153,153) text. The 1-channel difference from the prototype's #eee uses the existing product token. Outline labels use existing gray-800.
- Image quality/assets: the same full, unwarped raster sample is visible in the comparisons. Runtime student preview uses the user's selected Blob; persisted images use private signed URLs directly rather than a shared image optimizer. Existing Lucide icon family is retained.
- Copy/content: attachment and request action only in the ordinary student state; name/date/image/two decisions in the ordinary administrator state. Loading, error, rejected, pending and approved copy appears only when relevant. No prototype toolbar, account checklist, search, filters or reason editor was added.

## Verification

- Frontend: all 359 Node tests passed, no skips. Includes attachment validation, token refresh, retry file/key reuse, ID/status/URL validation, protected proxy preservation and account-switch upload prevention.
- Production Next build passed, including type validation.
- Browser harness check-implementation.cjs passed on actual Next pages with isolated mock API responses: gray disabled/active coral states; real file input and preview; submit/reload; approval/reload; rejected reattachment; identity reset; administrator 403; responsive layouts; no runtime exceptions. Pagination failure stops automatic requests and explicit retry successfully loads the next page.
- Backend: StudentVerificationServiceTest 7/7 and StudentVerificationHttpTest 2/2 passed, with zero skips. The latter uses disposable MySQL/Redis and mocked S3, including auth, foreign-owner file denial, registration retry, approval/conflict, rejection/resubmission, validation and manually applied schema.
- The new SQL migration was executed twice against the disposable database, and feature writes/reads passed on that schema.
- Local test tooling only: JDK 21 with --release 17, an ASCII junction for the Windows Gradle worker classpath, and Docker API 1.44 compatibility were configured in a temporary Gradle init script. Project dependencies/build configuration were not changed.
- Testcontainers cleaned up its disposable services. The pre-existing docker-db-1 container was not modified.

## Develop synchronization — 2026-11-18

- Compared the original feature files against frontend origin/develop at 2b8019e; there were no directly overlapping files. Pulled the latest develop into feat/student-verification with a fast-forward.
- Backend has no develop branch. Pulled its existing development base origin/dev-temp at f3a5616; the new upstream commit only merges the already-present CBT history fix, with no additional code diff.
- Reused the new common uploadContentType helper for student images with missing MIME metadata, including WebP, and normalized the multipart Blob type. Added regression coverage for inferred JPG/PNG/WebP types, filenames and original bytes, plus unsupported or explicitly mismatched types.
- Full frontend suite: 359 passed, zero failures/skips. Production build passed. Actual Next browser workflow passed with the updated AppRuntime, including upload, submit/reload, approval/reload, rejected reattachment, identity reset, admin 403 and pagination error recovery.
- Backend targeted verification is up-to-date against unchanged source; the existing 7 service tests and 2 HTTP/database tests remain green with zero skips.
- UI captures referenced above are local QA artifacts; the design-preview directory is not part of the product commit. Existing unrelated tsconfig.json changes are also excluded.
- Existing ESLint configuration excludes TS/TSX files; scoped lint reports ignored-file warnings. Type validation is covered by the production build, plus the Node/browser suites. No lint configuration change was included.
- Hooks run repository-wide autofix/format and build. For this scoped commit their checks are invoked manually (changed-file lint/format, conventional commit message and full build) to preserve unrelated local edits.

## Remaining deployment work

The backend migration docs/migrations/20261116_student_verification.sql must be applied before deploying the backend; production uses ddl-auto=validate. Production DB, live S3 writes and real iPad hardware were not tested or changed. Browser/API mocks and backend database integration are separate test layers, not a claim of an already deployed end-to-end service.

## Implementation checklist

- [x] Student upload/preview/request and disabled/active states.
- [x] Minimal administrator name/date/image/approve/reject.
- [x] My page entry points for student and administrator.
- [x] Private file access, server-side administrator authorization and owner binding.
- [x] Duplicate registration and opposing review protection.
- [x] Rejected resubmission and pagination error recovery.
- [x] Responsive source/app visual comparison and corrected P2 findings.
- [x] Frontend/backend tests, production build and schema replay verification.

---

## Previous notice design QA (historical)

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
