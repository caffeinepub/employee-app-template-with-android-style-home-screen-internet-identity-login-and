# Specification

## Summary
**Goal:** Fix the Admin Dashboard “Approved Users” rows on mobile so action buttons don’t overflow or get clipped, by adjusting alignment/spacing only.

**Planned changes:**
- Update only the “Approved Users” section row layout in `frontend/src/pages/AdminDashboard.tsx` (ApprovedUserRow markup/classes) to be responsive.
- On small screens, stack the row content and action buttons to fit narrow widths with consistent spacing/alignment and no overlap/clipping.
- On tablet/desktop, keep a horizontal row layout consistent with the current design.
- Keep all button labels, enabled/disabled logic, and click behaviors exactly the same (no functional changes).

**User-visible outcome:** On mobile devices, “Approved Users” rows display cleanly without horizontal overflow, and the “Make/Remove Admin” and “Remove” buttons remain fully visible and usable.
