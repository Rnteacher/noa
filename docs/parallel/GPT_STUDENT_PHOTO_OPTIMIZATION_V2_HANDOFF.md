# GPT Student Photo Upload Optimization V2 Handoff

This task implements browser-side photo optimization before uploading student profile photos. Input JPEGs/PNGs are center-cropped and converted into square WebP images at a compact 512x512 resolution.

---

## 1. Files Changed

- `src/app/(app)/students/[studentId]/PhotoUploadForm.tsx` [MODIFY] — Implemented `optimizeImage` using HTML5 canvas center-cropping and WebP conversion (`canvas.toBlob(..., 'image/webp', 0.82)`). Updates UI file size info and notices.
- `src/features/students/actions.ts` [MODIFY] — Hardened type and size validations in `updateStudentPhoto`: restricts accepted uploads strictly to `image/webp`, enforces a 1MB limit (down from 5MB), and forces storage file extension and headers to WebP.
- `src/i18n/en.json` & `he.json` [MODIFY] — Added translations for optimization notifications, optimized size badges, and processing failure warnings.

---

## 2. Optimization Parameters

- **Format**: WebP (`image/webp`)
- **Dimensions**: Square 512x512 pixels
- **Crop**: Center crop to square (preserves the central part of the input image without manual UI cropping controls)
- **Quality**: WebP quality 0.82 (produces compact sizes, typically 30KB - 80KB)
- **Metadata**: EXIF/metadata is automatically omitted during canvas drawing.

---

## 3. RLS & Security Model

- **Authentication/Authorization**: Upload authorization is still evaluated via `current_user_can_manage_student_photo` RPC, restricting uploads to counselor/mentors, managers, and super admins.
- **Client safety**: Raw/original high-resolution files are never uploaded. Only the post-optimization WebP Blob is sent across the network.
- **No service role usage**: Uploads use request-scoped Supabase client credentials with RLS policies fully enforced.

---

## 4. Browser Verification

Completed in a later pass against a real authenticated Google OAuth session (super_admin) and a real Chrome browser, with two real images personally selected by the user (automation cannot supply an arbitrary local file to a native OS file picker). No code bugs were found. Summary (see `docs/12_CURRENT_STATE.md`'s "Student photo upload optimization v2 is implemented" section for full detail):

- **Real image tests**: a large real JPEG, then a real PNG, were both uploaded to Alice Smith's student card. Both produced a correctly stored WebP object at `students/55000000-0000-0000-0000-000000000001/profile.webp`, `content_type: image/webp`, sizes 22458 and 28096 bytes (well under the 1MB limit). Dimensions were confirmed exactly 512x512 by parsing the WebP `VP8X` header directly from the downloaded object bytes. `students.photo_url` pointed to the expected path in both cases, the signed-URL `<img>` on the student card visibly updated after each upload, and both produced correct `student_photo.updated` audit rows (`before_data`/`after_data` containing only `photo_url`).
- **Negative paths** (tested via in-browser JS-constructed `File` objects for repeatability, since the OS picker can't be scripted): an invalid `.txt` file, a 41MB oversized valid JPEG, a corrupted non-decodable "image" byte sequence, and a simulated `canvas.toBlob` failure (a real conversion-failure path, not just a type/size check) were all rejected with the correct clean, localized error message. No network upload occurred in any case (confirmed via the storage object's unchanged version/timestamp). The file input was disabled during processing (confirmed at t+0ms and t+50ms after triggering) and correctly re-enabled after both success and failure.
- **Security/RLS**: verified with rollback-only SQL probes directly against the local Postgres container. An unrelated staff member (no mentor/manager/super_admin relationship to the student) is denied by `current_user_can_manage_student_photo`, and the same role's direct `UPDATE students SET photo_url = ...` affects 0 rows (blocked by RLS). The `student-photos` bucket is confirmed private (`storage.buckets.public = false`); an anonymous direct object download returns 400. No service-role client is used anywhere in the upload code path (confirmed by code inspection — only the request-scoped client is used for both the storage upload and the RPC call).

**Finding, not fixed (documented precisely rather than overstated or silently dropped)**: reading the `update_student_photo_path` RPC's source confirmed it does real validation beyond permissions — it requires the new path to match `^students/{target_student_id}/`, preventing arbitrary or cross-student paths. A rollback-only probe showed that a **privileged** (manager/super_admin) session can bypass this validation entirely via a raw direct `UPDATE students SET photo_url = 'anything'` — RLS is row-level, not column-level, so the same broad `UPDATE` grant these roles already hold for other student-editing flows incidentally also covers `photo_url`. This is not exploitable by unauthorized users (it requires an already-privileged session) and no current app code path performs this bypass, but it is a real defense-in-depth gap versus the RPC's validation. Not fixed in this pass — closing it would need a schema change (e.g. a `BEFORE UPDATE` trigger or column-scoped policy), which is outside this task's "no schema changes unless a real blocker" scope. Flagged as a follow-up in `docs/12_CURRENT_STATE.md` and `docs/handoff.md`.

All test data was cleaned up afterward: the uploaded storage object was deleted and `students.photo_url` for the test student was reset to `null`, matching the original seed state.

---

## 5. Validation Results

- `npm run check:no-hebrew-in-code` — Pass (no Hebrew character literals exist in implementation code).
- `npm run lint` — Pass (0 warnings, 0 errors).
- `npm run build` — Pass (compiled production build successfully).
- `git diff --check` — Pass (0 trailing whitespace violations).

---

## 6. Deferred Scopes

- **Manual crop UI**: Users cannot interactively adjust crop anchors.
- **Bulk import**: Photo ingestion remains per-student.
- **Image moderation**: No outbound safety/moderation APIs are called.
- **Responsive image variants**: Only a single 512x512 variant is written to storage.
