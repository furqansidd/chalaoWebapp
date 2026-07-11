# Frontend Phase 10 Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement the pre-trip/post-trip photo upload UI forms, check-in/check-out endpoint integrations, and damage report visualization overlay on the booking detail page.

**Architecture:** Extend `/bookings/[id]/page.tsx` to handle check-in/check-out uploading and display the structural similarity/damage report data block if generated.

**Tech Stack:** Next.js Page Router/Components, Vitest, JSDOM

---

### Task 1: Check-in/Check-out Form & Damage Report Display

**Files:**
- Modify: `web/src/app/bookings/[id]/page.tsx`
- Modify: `web/src/app/bookings/[id]/page.test.tsx`

**Step 1: Write the failing test**
Update [page.test.tsx](file:///e:/interviewtest/web/src/app/bookings/[id]/page.test.tsx):
- Test that a renter on a `PAID` booking sees 6 pre-trip upload fields (front, back, left, right, interior, odometer) and can trigger check-in submission.
- Test that a renter on an `ACTIVE` booking sees 6 post-trip upload fields and can trigger check-out submission.
- Test that a completed booking with `damageReport` renders similarity metrics and the resulting heatmap image path.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/bookings/[id]/page.test.tsx"`
Expected: FAIL

**Step 3: Implement components in bookings detail page**
Modify [page.tsx](file:///e:/interviewtest/web/src/app/bookings/[id]/page.tsx):
- Add file path strings form input components for `front`, `back`, `left`, `right`, `interior`, and `odometer` values.
- Integrate POST requests to `/api/bookings/[id]/checkin` and `/api/bookings/[id]/checkout`.
- Add conditional block rendering the DamageReport summary panel (`similarityScore` percentage display, zones list, and image visualization).

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/bookings/[id]/page.test.tsx"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/bookings/[id]/page.tsx web/src/app/bookings/[id]/page.test.tsx
git commit -m "feat: implement check-in, check-out forms and damage reports"
```

---

## Verification Plan

### Automated Tests
- Verification of test suites:
  `powershell -ExecutionPolicy Bypass -Command "npm test"`
