// @vitest-environment jsdom
import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import AdminConsolePage from "./page";
import { AuthProvider, useAuth } from "../../lib/AuthContext";

const mockPush = vi.fn();
vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

vi.mock("../../lib/AuthContext", async () => {
  const actual = await vi.importActual<any>("../../lib/AuthContext");
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

describe("Admin Console Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  test("unauthorized access message if role is not ADMIN", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { userId: "user-uuid", email: "user@example.com", role: "USER" },
      token: "mock-jwt-token",
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    await act(async () => {
      render(
        <AuthProvider>
          <AdminConsolePage />
        </AuthProvider>
      );
    });

    expect(screen.getByText("Access Denied")).toBeDefined();
    expect(screen.getByText(/You must be an administrator/)).toBeDefined();
  });

  test("renders admin panel correctly when role is ADMIN", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { userId: "admin-uuid", email: "admin@example.com", role: "ADMIN" },
      token: "mock-jwt-token",
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    const mockBookings = [
      {
        id: "booking-1",
        startDate: "2026-07-10T00:00:00.000Z",
        endDate: "2026-07-12T00:00:00.000Z",
        status: "PENDING_PAYMENT",
        totalPrice: 10000,
        paymentMethod: "IBFT",
        paymentReceipt: "/receipts/rect1.jpg",
        car: { make: "Honda", model: "Civic" },
        renter: { name: "John Doe" },
      },
    ];

    const mockDisputes = [
      {
        id: "dispute-1",
        reason: "Car scratch not by me",
        status: "OPEN",
        createdAt: "2026-07-09T00:00:00.000Z",
        booking: {
          id: "booking-2",
          car: { make: "Toyota", model: "Aqua" },
          renter: { name: "Sarah Smith" },
        },
      },
    ];

    // Fetch lists mock
    vi.mocked(global.fetch).mockImplementation((url: any) => {
      if (url.includes("/api/admin/bookings")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ bookings: mockBookings }),
        } as any);
      }
      if (url.includes("/api/admin/disputes")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ disputes: mockDisputes }),
        } as any);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as any);
    });

    await act(async () => {
      render(
        <AuthProvider>
          <AdminConsolePage />
        </AuthProvider>
      );
    });

    expect(screen.getByText("Admin Console Dashboard")).toBeDefined();
    expect(screen.getByText("IBFT Payments Queue")).toBeDefined();
    expect(screen.getByText("Honda Civic")).toBeDefined();
    expect(screen.getByText("Verify Payment")).toBeDefined();

    // Toggle Tab Disputes
    const disputesTabButton = screen.getByText("Disputes Queue");
    await act(async () => {
      fireEvent.click(disputesTabButton);
    });

    expect(screen.getByText("Car scratch not by me")).toBeDefined();
    expect(screen.getByText("Toyota Aqua")).toBeDefined();
    expect(screen.getByText("Resolve Dispute")).toBeDefined();
  });
});
