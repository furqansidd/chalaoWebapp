# Frontend Phase 11 Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement the Renter Review and Dispute filing forms on the booking detail page, and create the multi-tabbed Admin Console page for verification/approvals.

**Architecture:**
1. Extend `/bookings/[id]/page.tsx` to display review star forms and dispute modal boxes.
2. Build `/admin` dashboard restricting access to users with `ADMIN` role, supporting sub-views for verifying IBFT bank receipts and managing disputes.

**Tech Stack:** Next.js Page Router/Components, Vitest, JSDOM

---

### Task 1: Reviews and Disputes UI

**Files:**
- Modify: `web/src/app/bookings/[id]/page.tsx`
- Modify: `web/src/app/bookings/[id]/page.test.tsx`

**Step 1: Write the failing test**
Update [page.test.tsx](file:///e:/interviewtest/web/src/app/bookings/[id]/page.test.tsx):
- Test that a completed booking shows "Leave a Review" form with a rating selector.
- Test that a completed booking shows a "File Dispute" form collecting reasons.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/bookings/[id]/page.test.tsx"`
Expected: FAIL

**Step 3: Implement components in bookings detail page**
Modify [page.tsx](file:///e:/interviewtest/web/src/app/bookings/[id]/page.tsx):
- Add reviews form (rating selection and comment input) targeting `/api/bookings/[id]/reviews`.
- Add dispute section collecting reasons targeting `/api/bookings/[id]/dispute`.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/bookings/[id]/page.test.tsx"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/bookings/[id]/page.tsx web/src/app/bookings/[id]/page.test.tsx
git commit -m "feat: implement review and dispute filing forms on bookings page"
```

---

### Task 2: Admin Console Dashboard

**Files:**
- Create: `web/src/app/admin/page.tsx`
- Test: `web/src/app/admin/page.test.tsx`

**Step 1: Write the failing test**
Create [page.test.tsx](file:///e:/interviewtest/web/src/app/admin/page.test.tsx):
- Redirect/lock if not ADMIN.
- Renders admin dashboard when logged-in role is ADMIN.
- Displays lists of active disputes and button to resolve/dismiss.
- Displays lists of manual bookings requiring IBFT verification and verification action buttons.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/admin/page.test.tsx"`
Expected: FAIL

**Step 3: Implement Admin Console**
Create [page.tsx](file:///e:/interviewtest/web/src/app/admin/page.tsx):
- Verifies session is ADMIN (shows lock visual if regular USER).
- Fetches disputes from `/api/admin/disputes` and bookings from `/api/admin/bookings`.
- Connects action callbacks to resolve/dismiss and verify-payment endpoints.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/admin/page.test.tsx"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/admin/page.tsx web/src/app/admin/page.test.tsx
git commit -m "feat: implement Admin Console portal"
```

---

## Verification Plan

### Automated Tests
- Verification of test suites:
  `powershell -ExecutionPolicy Bypass -Command "npm test"`
