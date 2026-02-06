# Specification

## Summary
**Goal:** Make the admin approval workflow reliable, improve the access request experience with name + 4-character request ID, and clearly manage roles (Admin vs Approved User) including full user removal.

**Planned changes:**
- Fix Admin Dashboard Approve/Reject for pending approvals so actions update the backend, avoid invalid Principal usage, and refresh lists via query refetch/invalidation (no full page reload).
- Update the access request flow to require a user-entered name, persist request metadata server-side, and show a pending state that displays the stored name plus a backend-generated 4-character identifier (survives refresh).
- Add backend support for generating, storing, and returning an exactly-4-character request identifier per pending request, with collision handling.
- Update the Admin Dashboard pending approvals list to display the requester’s stored name and 4-character identifier (with a clear fallback for legacy requests missing data).
- Add/clarify backend role logic and Admin Dashboard UI to distinguish Admins vs Approved Users, including admin-only ability to grant/revoke admin rights with role shown in the approved users list.
- Add an admin-only “Remove user” action for approved users that fully deletes access rights (and revokes admin rights if present), requiring the user to request approval again.
- Ensure frontend state stays consistent by invalidating/refetching React Query data after approval/rejection/role changes/removal and by updating the logged-in user access gating state accordingly.

**User-visible outcome:** Admins can approve/reject requests and manage roles/removals with immediate UI updates; new users request access by entering a name and then see a pending screen showing their name and a shared 4-character request ID that admins also see.
