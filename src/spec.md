# Specification

## Summary
**Goal:** Make `requestApprovalWithName(name)` in the Motoko backend strictly and idempotently clear any existing backend state for the caller principal before creating a new pending approval request.

**Planned changes:**
- Update `backend/main.mo` so `requestApprovalWithName(name)` performs a full cleanup of all stored records for the caller principal (pending/approved state, admin/role state, stored profile/name, and any access-request / four-character-id metadata) before writing a new `{name, fourCharId}` pending request.
- Ensure the flow remains idempotent and consistent when called multiple times by the same unapproved principal (no duplicate/leftover state and no traps due to duplicates).
- Preserve existing guard behavior that prevents admin principals from requesting approval, and ensure no other principals’ records are modified.

**User-visible outcome:** A previously deleted/removed principal can request approval again and reliably appear as a fresh pending approval in the Admin Dashboard; repeated requests keep a single coherent pending state and return `{name, fourCharId}`.
