# Frontend Phase 9 Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement the Renter/Owner Switching Dashboard screen and the Booking Details/Actions screen.

**Architecture:**
1. Build `/dashboard` to load statistics and display lists of rentals/cars based on active renter/owner role.
2. Build `/bookings/[id]` to render booking states and action buttons (Approve, Pay).

**Tech Stack:** Next.js Page Router/Components, Vitest, JSDOM

---

### Task 1: Renter/Owner Switching Dashboard Page

**Files:**
- Create: `web/src/app/dashboard/page.tsx`
- Test: `web/src/app/dashboard/page.test.tsx`

**Step 1: Write the failing test**
Create [page.test.tsx](file:///e:/interviewtest/web/src/app/dashboard/page.test.tsx):
- Redirect to login if user not authenticated.
- Render Renter view by default showing bookings and expenditure stats.
- Toggle to Owner view displaying owner listings, income stats, and pending approvals.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/dashboard/page.test.tsx"`
Expected: FAIL

**Step 3: Implement Dashboard**
Create [page.tsx](file:///e:/interviewtest/web/src/app/dashboard/page.tsx):
- Queries `/api/dashboard` and toggles view between Owner/Renter metrics.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/dashboard/page.test.tsx"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/dashboard/page.tsx web/src/app/dashboard/page.test.tsx
git commit -m "feat: implement Renter/Owner Switching Dashboard"
```

---

### Task 2: Booking Detail & Action Page (Approve/Pay Flow)

**Files:**
- Create: `web/src/app/bookings/[id]/page.tsx`
- Test: `web/src/app/bookings/[id]/page.test.tsx`

**Step 1: Write the failing test**
Create [page.test.tsx](file:///e:/interviewtest/web/src/app/bookings/[id]/page.test.tsx):
- Render booking summary (start/end dates, base price, dynamic price, deposit).
- If status is `PENDING_APPROVAL` and logged-in user is Owner, displays "Approve Booking" button.
- If status is `PENDING_PAYMENT` and logged-in user is Renter, displays payment selection (Stripe vs IBFT) and payment submit controls.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/bookings/page.test.tsx"`
Expected: FAIL

**Step 3: Implement Booking Details Page**
Create [page.tsx](file:///e:/interviewtest/web/src/app/bookings/[id]/page.tsx):
- Fetches booking profile.
- Renders dynamic actions panel mapping to approve and pay endpoints.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/bookings/[id]/page.test.tsx"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/bookings/[id]/page.tsx web/src/app/bookings/[id]/page.test.tsx
git commit -m "feat: implement Booking Details and Action workflows"
```

---

## Verification Plan

### Automated Tests
- Verification of test suites:
  `powershell -ExecutionPolicy Bypass -Command "npm test"`
