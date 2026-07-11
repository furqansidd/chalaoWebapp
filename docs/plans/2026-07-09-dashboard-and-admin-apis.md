# Dashboard and Admin APIs Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement the Owner/Renter Switching Dashboard API and the Admin Console API Endpoints for user, booking payment, and dispute management.

**Architecture:** Create Next.js Route Handlers for `/api/dashboard` to handle switching role statistics/listings, and `/api/admin/...` for admin functions including payment review, user verification, and dispute resolution.

**Tech Stack:** Next.js Route Handlers, Prisma ORM, Vitest

---

### Task 1: Owner/Renter Switching Dashboard API

**Files:**
- Create: `web/src/app/api/dashboard/route.ts`
- Test: `web/src/app/api/dashboard/route.test.ts`

**Step 1: Write the failing test**
Create [route.test.ts](file:///e:/interviewtest/web/src/app/api/dashboard/route.test.ts) with test cases validating:
- 401 error if unauthorized.
- 400 error if `role` query param is missing, empty, or invalid.
- Correct renter statistics (`totalSpent`, `bookingsCount`, `activeBookingsCount`) and `bookings` listing.
- Correct owner statistics (`totalEarnings`, `activeBookingsCount`, `pendingApprovalsCount`, `carsCount`), `bookings`, and `cars` listing.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/api/dashboard/route.test.ts"`
Expected: FAIL due to missing handler file.

**Step 3: Write minimal implementation**
Create [route.ts](file:///e:/interviewtest/web/src/app/api/dashboard/route.ts) that parses the JWT token, extracts query parameter `role`, and runs Prisma queries to aggregate stats and retrieve listings based on the user ID and role.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/api/dashboard/route.test.ts"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/api/dashboard/route.ts web/src/app/api/dashboard/route.test.ts
git commit -m "feat: implement Owner/Renter switching dashboard API"
```

---

### Task 2: Admin GET Bookings Pending Payment Review API

**Files:**
- Create: `web/src/app/api/admin/bookings/route.ts`
- Test: `web/src/app/api/admin/bookings/route.test.ts`

**Step 1: Write the failing test**
Create [route.test.ts](file:///e:/interviewtest/web/src/app/api/admin/bookings/route.test.ts) with test cases validating:
- 401 if unauthorized.
- 403 if user is not an ADMIN.
- Correct retrieval of bookings with status `PENDING_PAYMENT` and `paymentMethod: "IBFT"`.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/api/admin/bookings/route.test.ts"`
Expected: FAIL

**Step 3: Write minimal implementation**
Create [route.ts](file:///e:/interviewtest/web/src/app/api/admin/bookings/route.ts) that verifies admin role and queries the database.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/api/admin/bookings/route.test.ts"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/api/admin/bookings/route.ts web/src/app/api/admin/bookings/route.test.ts
git commit -m "feat: implement admin list bookings pending payment review"
```

---

### Task 3: Admin Verify Booking IBFT Payment API

**Files:**
- Create: `web/src/app/api/admin/bookings/[id]/verify-payment/route.ts`
- Test: `web/src/app/api/admin/bookings/[id]/verify-payment/route.test.ts`

**Step 1: Write the failing test**
Create [route.test.ts](file:///e:/interviewtest/web/src/app/api/admin/bookings/[id]/verify-payment/route.test.ts) validating:
- 401 if unauthorized.
- 403 if user is not an ADMIN.
- 404 if booking not found.
- 400 if booking is not in `PENDING_PAYMENT` status or not using `IBFT`.
- 400 if target status is not `PAID` or `CANCELLED`.
- Successfully updates booking status to `PAID` or `CANCELLED` and returns the booking.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/api/admin/bookings/[id]/verify-payment/route.test.ts"`
Expected: FAIL

**Step 3: Write minimal implementation**
Create [route.ts](file:///e:/interviewtest/web/src/app/api/admin/bookings/[id]/verify-payment/route.ts) that enforces authorization and validates state before executing the update.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/api/admin/bookings/[id]/verify-payment/route.test.ts"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/api/admin/bookings/[id]/verify-payment/route.ts web/src/app/api/admin/bookings/[id]/verify-payment/route.test.ts
git commit -m "feat: implement admin verify booking payment API"
```

---

### Task 4: Admin Verify User Profile API

**Files:**
- Create: `web/src/app/api/admin/users/[id]/verify/route.ts`
- Test: `web/src/app/api/admin/users/[id]/verify/route.test.ts`

**Step 1: Write the failing test**
Create [route.test.ts](file:///e:/interviewtest/web/src/app/api/admin/users/[id]/verify/route.test.ts) validating:
- 401/403 controls.
- 404 if user not found.
- Successfully sets `isVerified = true` on the user profile.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/api/admin/users/[id]/verify/route.test.ts"`
Expected: FAIL

**Step 3: Write minimal implementation**
Create [route.ts](file:///e:/interviewtest/web/src/app/api/admin/users/[id]/verify/route.ts) to execute the update.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/api/admin/users/[id]/verify/route.test.ts"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/api/admin/users/[id]/verify/route.ts web/src/app/api/admin/users/[id]/verify/route.test.ts
git commit -m "feat: implement admin verify user API"
```

---

### Task 5: Admin Dispute Management APIs (List and Resolve/Dismiss)

**Files:**
- Create: `web/src/app/api/admin/disputes/route.ts`
- Create: `web/src/app/api/admin/disputes/[id]/route.ts`
- Test: `web/src/app/api/admin/disputes/route.test.ts`

**Step 1: Write the failing test**
Create [route.test.ts](file:///e:/interviewtest/web/src/app/api/admin/disputes/route.test.ts) validating:
- 401/403 authorization for both endpoints.
- List all disputes successfully.
- 404 for updating a non-existent dispute.
- 400 for invalid status in dispute PATCH body (must be `RESOLVED` or `DISMISSED`).
- Successfully updates dispute status.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/api/admin/disputes/route.test.ts"`
Expected: FAIL

**Step 3: Write minimal implementation**
Create both route files:
- [route.ts](file:///e:/interviewtest/web/src/app/api/admin/disputes/route.ts)
- [route.ts](file:///e:/interviewtest/web/src/app/api/admin/disputes/[id]/route.ts)

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/api/admin/disputes/route.test.ts"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/api/admin/disputes/route.ts web/src/app/api/admin/disputes/[id]/route.ts web/src/app/api/admin/disputes/route.test.ts
git commit -m "feat: implement admin dispute list and resolve APIs"
```

---

## Verification Plan

### Automated Tests
- Run all test suites inside `web` folder to ensure nothing is broken and all new APIs function correctly:
  `powershell -ExecutionPolicy Bypass -Command "npm test"`
