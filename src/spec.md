# Specification

## Summary
**Goal:** Ensure a previously deleted/removed principal is treated as a fully new requester when they submit a new access request, so a fresh pending approval is created and visible to admins.

**Planned changes:**
- On access-request submission, detect principals that were previously removed/deleted and clear any stored backend records for that principal that could block creating a fresh pending approval (e.g., leftover pending/approved/role state and any stored access-request/profile data).
- Create a new pending approval request for that principal after clearing stale records, and ensure it appears in the Admin Dashboard Pending Approvals list with the correct name and 4-character identifier.

**User-visible outcome:** A user who was previously removed can log in and submit a new access request successfully, and admins will see a new corresponding pending approval entry for that principal.
