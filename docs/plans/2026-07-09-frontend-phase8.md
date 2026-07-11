# Frontend Phase 8 Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement the Car Browse/Search screen, Vehicle details screen, dynamic car listing creation page, and a backend route to retrieve a single car.

**Architecture:**
1. Create `GET /api/cars/[id]` to fetch details for a single vehicle.
2. Build the main page `/` to query and filter cars.
3. Build the `/cars/[id]` details page containing a dynamic booking price estimator form.
4. Build `/cars/new` listing creation form for owners.

**Tech Stack:** Next.js Page Router/Components, Prisma ORM, Vitest, JSDOM

---

### Task 1: Create Single Car Retrieval API Endpoint

**Files:**
- Create: `web/src/app/api/cars/[id]/route.ts`
- Test: `web/src/app/api/cars/[id]/route.test.ts`

**Step 1: Write the failing test**
Create [route.test.ts](file:///e:/interviewtest/web/src/app/api/cars/[id]/route.test.ts):
- 404 if car not found.
- 200 with car details if found.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/api/cars/[id]/route.test.ts"`
Expected: FAIL

**Step 3: Implement route**
Create [route.ts](file:///e:/interviewtest/web/src/app/api/cars/[id]/route.ts):
- Retrieves parameter `id` and queries the database via `prisma.car.findUnique`.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/api/cars/[id]/route.test.ts"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/api/cars/[id]/route.ts web/src/app/api/cars/[id]/route.test.ts
git commit -m "feat: implement GET /api/cars/:id endpoint"
```

---

### Task 2: Car Browse & Search Page (Main Page)

**Files:**
- Create: `web/src/app/page.tsx`
- Test: `web/src/app/page.test.tsx`

**Step 1: Write the failing test**
Create [page.test.tsx](file:///e:/interviewtest/web/src/app/page.test.tsx):
- Renders search input elements (city dropdown, date inputs).
- Displays default lists of cars.
- Performs a filtered fetch request upon form submission and updates list elements.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/page.test.tsx"`
Expected: FAIL

**Step 3: Implement main search page**
Create [page.tsx](file:///e:/interviewtest/web/src/app/page.tsx):
- Collects inputs, queries `/api/cars` dynamically, and renders a grid of vehicle cards.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/page.test.tsx"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/page.tsx web/src/app/page.test.tsx
git commit -m "feat: implement Car Browse and Search page"
```

---

### Task 3: Car Detail Page (Renter Form View)

**Files:**
- Create: `web/src/app/cars/[id]/page.tsx`
- Test: `web/src/app/cars/[id]/page.test.tsx`

**Step 1: Write the failing test**
Create [page.test.tsx](file:///e:/interviewtest/web/src/app/cars/[id]/page.test.tsx) with mock parameters, testing:
- Renders loading spinner/states.
- Renders correct details (make, model, rate, city).
- Shows a form to choose booking dates.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/cars/[id]/page.test.tsx"`
Expected: FAIL

**Step 3: Implement Detail Page**
Create [page.tsx](file:///e:/interviewtest/web/src/app/cars/[id]/page.tsx):
- Fetches from `/api/cars/[id]`, shows specifications inside a glass card, and displays reservation form.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/cars/[id]/page.test.tsx"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/cars/[id]/page.tsx web/src/app/cars/[id]/page.test.tsx
git commit -m "feat: implement vehicle details page"
```

---

### Task 4: Create Car Listing Form (Owner View)

**Files:**
- Create: `web/src/app/cars/new/page.tsx`
- Test: `web/src/app/cars/new/page.test.tsx`

**Step 1: Write the failing test**
Create [page.test.tsx](file:///e:/interviewtest/web/src/app/cars/new/page.test.tsx):
- Render form inputs (make, model, year, plate number, city dropdown, base price).
- Submit new vehicle data to `/api/cars` and redirect home.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/cars/new/page.test.tsx"`
Expected: FAIL

**Step 3: Implement new vehicle listing form**
Create [page.tsx](file:///e:/interviewtest/web/src/app/cars/new/page.tsx):
- Check auth state (redirect to login if anonymous).
- Form page submitting to `POST /api/cars`.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/cars/new/page.test.tsx"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/cars/new/page.tsx web/src/app/cars/new/page.test.tsx
git commit -m "feat: implement create car listing form"
```

---

## Verification Plan

### Automated Tests
- Verification of test suites:
  `powershell -ExecutionPolicy Bypass -Command "npm test"`
