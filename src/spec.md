# Specification

## Summary
**Goal:** Fix the access request flow so the frontend no longer calls the deprecated `requestApproval()` method and instead uses `requestApprovalWithName(name)` with a user-provided name.

**Planned changes:**
- Find and remove/replace any frontend UI paths that call `actor.requestApproval()` during the request-access flow.
- Update request-access actions to call `actor.requestApprovalWithName(name)` and pass a name collected from the user.
- Add/adjust UI validation so submission is blocked when the name is missing, with a clear English prompt.

**User-visible outcome:** New/unapproved users can request approval without seeing the deprecated-method error, and the app prompts for a name (and requires it) before submitting the request.
