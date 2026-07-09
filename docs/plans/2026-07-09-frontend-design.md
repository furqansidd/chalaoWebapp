# Frontend Design Document

## 1. Visual Theme & Styling System
- **Styling approach:** Vanilla CSS + CSS Variables for a responsive glassmorphism aesthetic.
- **Design Aesthetic:** Dark-mode-first premium look with soft glowing gradients, backdrop-filters (blur), and rounded borders.
- **Colors:**
  - Background: `#0B0F19` (rich deep dark navy)
  - Card/Overlay Background: `rgba(20, 27, 45, 0.7)` with `backdrop-filter: blur(12px)`
  - Primary Accent: `#3B82F6` (vibrant blue)
  - Success/Verify Accent: `#10B981` (emerald green)
  - Warning/High Risk Accent: `#F59E0B` (amber orange)
  - Error Accent: `#EF4444` (rose red)
  - Borders: `rgba(255, 255, 255, 0.08)`
  - Text Primary: `#F3F4F6` (off-white)
  - Text Secondary: `#9CA3AF` (gray)

## 2. Navigation & Page Structure
Next.js App Router will map out these user-facing routes:
- **`/` (Landing & Browse):** Search box (city, dates filter), responsive grid of available cars with dynamic pricing preview.
- **`/auth/login` & `/auth/register`:** Premium forms with loading micro-animations and validation.
- **`/cars/[id]`:** Vehicle info, specifications, and interactive calendar booking form dynamically estimating prices.
- **`/cars/new`:** Form to list a new vehicle (owner only).
- **`/dashboard`:** Single switching dashboard:
  - Renter view: List of bookings, spending stats, active rentals.
  - Owner view: Car list, total earnings, pending approvals, active rentals.
- **`/bookings/[id]`:** Detail page. Adapts actions based on status:
  - Pending approval -> Approve button (owner).
  - Approved / Pending Payment -> Stripe pay simulation / IBFT upload button (renter).
  - Paid / Check-in -> Pre-trip photos upload form (renter).
  - Active / Check-out -> Post-trip photos upload form (renter).
  - Completed -> Review form / Dispute button.
  - Damage Report -> Displays similarities and overlaid contour visual.
- **`/admin`:** Admin Control Panel with tabbed controls for User Verification, Dispute Management, and Payment Approval.

## 3. Architecture & State Management
- **Auth state:** A client-side React Context (`AuthContext`) storing the decoded session payload. Persists the JWT in `localStorage` and includes it in the `Authorization: Bearer <token>` header of API requests.
- **Data fetching:** Wrapper fetch helper that handles request headers, base URL, and JSON parsing.
- **Testing:** Extend `vitest` to support JSDOM testing using `@testing-library/react`.
