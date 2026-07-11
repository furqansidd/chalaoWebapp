# Frontend Phase 7 Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Establish the design system, shared layout/nav, and authentication pages (login/register) with standard unit testing tools.

**Architecture:** Create global CSS stylesheets, root layout, Navigation component, client-side AuthContext provider, and auth route pages.

**Tech Stack:** React, Next.js, Vanilla CSS, Vitest, JSDOM, Testing Library

---

### Task 1: Component Testing Setup

**Files:**
- Modify: `web/package.json`
- Modify: `web/vitest.config.ts`

**Step 1: Install devDependencies**
Run command:
`powershell -ExecutionPolicy Bypass -Command "npm install -D jsdom @testing-library/react @testing-library/jest-dom"`

**Step 2: Add JSDOM setup check test**
Create [setup.test.tsx](file:///e:/interviewtest/web/src/setup.test.tsx):
```tsx
// @vitest-environment jsdom
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

test("JSDOM works with React testing library", () => {
  render(<h1>Hello from Test</h1>);
  expect(screen.getByText("Hello from Test")).toBeDefined();
});
```

**Step 3: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/setup.test.tsx"`
Expected: PASS

**Step 4: Commit**
Run:
```bash
git add web/package.json web/package-lock.json web/vitest.config.ts web/src/setup.test.tsx
git commit -m "test: set up JSDOM react testing environment"
```

---

### Task 2: Design System Styling (Global CSS)

**Files:**
- Create: `web/src/app/globals.css`

**Step 1: Create global CSS and design variables**
Create [globals.css](file:///e:/interviewtest/web/src/app/globals.css):
```css
:root {
  --background: #0b0f19;
  --card-bg: rgba(20, 27, 45, 0.7);
  --border: rgba(255, 255, 255, 0.08);
  --primary: #3b82f6;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --text-primary: #f3f4f6;
  --text-secondary: #9ca3af;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--background);
  color: var(--text-primary);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  min-height: 100vh;
}

.glass-card {
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
}

.btn-primary {
  background-color: var(--primary);
  color: var(--text-primary);
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
}
.btn-primary:hover {
  opacity: 0.9;
}
```

**Step 2: Commit**
Run:
```bash
git add web/src/app/globals.css
git commit -m "style: define global CSS and variables design system"
```

---

### Task 3: AuthContext and AuthProvider

**Files:**
- Create: `web/src/lib/AuthContext.tsx`
- Test: `web/src/lib/AuthContext.test.tsx`

**Step 1: Write the failing test**
Create [AuthContext.test.tsx](file:///e:/interviewtest/web/src/lib/AuthContext.test.tsx):
- Validates initial state is logged out.
- Validates storing token sets user state.
- Validates logout clears token.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/lib/AuthContext.test.tsx"`
Expected: FAIL

**Step 3: Implement AuthContext**
Create [AuthContext.tsx](file:///e:/interviewtest/web/src/lib/AuthContext.tsx) with a hook `useAuth()` to export user, role, token, login(token), and logout() routines. Decodes standard base64 JWT payload dynamically to construct the user session state.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/lib/AuthContext.test.tsx"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/lib/AuthContext.tsx web/src/lib/AuthContext.test.tsx
git commit -m "feat: implement AuthContext user state manager"
```

---

### Task 4: Shared Layout & Navigation Header

**Files:**
- Create: `web/src/app/layout.tsx`
- Create: `web/src/app/components/Navbar.tsx`
- Test: `web/src/app/components/Navbar.test.tsx`

**Step 1: Write failing test for Navbar**
Create [Navbar.test.tsx](file:///e:/interviewtest/web/src/app/components/Navbar.test.tsx):
- Test displays sign in/register buttons when logged out.
- Test displays user info (email) and logout button when logged in.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/components/Navbar.test.tsx"`
Expected: FAIL

**Step 3: Implement Navbar & Layout**
Create [Navbar.tsx](file:///e:/interviewtest/web/src/app/components/Navbar.tsx).
Create [layout.tsx](file:///e:/interviewtest/web/src/app/layout.tsx) wrapping the app inside `AuthProvider`.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/components/Navbar.test.tsx"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/layout.tsx web/src/app/components/Navbar.tsx web/src/app/components/Navbar.test.tsx
git commit -m "feat: implement shared root layout and Navigation header"
```

---

### Task 5: Authentication Pages (Login & Register)

**Files:**
- Create: `web/src/app/auth/login/page.tsx`
- Create: `web/src/app/auth/register/page.tsx`
- Test: `web/src/app/auth/login/page.test.tsx`
- Test: `web/src/app/auth/register/page.test.tsx`

**Step 1: Write failing tests**
Create [page.test.tsx](file:///e:/interviewtest/web/src/app/auth/login/page.test.tsx) and [page.test.tsx](file:///e:/interviewtest/web/src/app/auth/register/page.test.tsx) to test:
- Render input forms and submission buttons.
- Handle form input state.
- Submit correct data and display error message on network failure.

**Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/auth/"`
Expected: FAIL

**Step 3: Implement Login and Register pages**
Create both [page.tsx](file:///e:/interviewtest/web/src/app/auth/login/page.tsx) and [page.tsx](file:///e:/interviewtest/web/src/app/auth/register/page.tsx) using simple styling and fetching helpers.

**Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -Command "npx vitest run src/app/auth/"`
Expected: PASS

**Step 5: Commit**
Run:
```bash
git add web/src/app/auth/login/page.tsx web/src/app/auth/register/page.tsx web/src/app/auth/login/page.test.tsx web/src/app/auth/register/page.test.tsx
git commit -m "feat: implement login and registration pages"
```

---

## Verification Plan

### Automated Tests
- Run all component and API test suites to verify compile and pass:
  `powershell -ExecutionPolicy Bypass -Command "npm test"`
