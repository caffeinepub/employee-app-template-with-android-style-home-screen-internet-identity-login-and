# Specification

## Summary
**Goal:** Prevent HTTP 413 “payload too large” errors when uploading camera images in the Admin Dashboard’s “Add Custom Module” form by compressing images client-side, and improve diagnostics by showing raw backend error details on failure.

**Planned changes:**
- Add automatic client-side image compression in the “Add Custom Module” image upload flow before calling the `createCustomModule` mutation, while preserving original quality/behavior for already-small images.
- If compression fails, abort module creation and show an error to the user.
- Update the “Add Custom Module” form error handling to display the most informative backend-provided error text available (e.g., HTTP status and response body), with safe fallbacks for non-standard thrown errors.

**User-visible outcome:** Admins can upload camera-captured images for new Custom Modules without hitting HTTP 413 in common cases, and if module creation fails, they can see the raw backend error details directly in the Custom Modules section to help diagnose the issue.
