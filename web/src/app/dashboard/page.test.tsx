// @vitest-environment jsdom
import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import DashboardPage from "./page";
import { AuthProvider, useAuth } from "../../lib/AuthContext";

const mockPush = vi.fn();
vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

vi.mock("../../lib/AuthContext", () => {
  const actual = vi.importActual("../../lib/AuthContext");
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  test("redirects to login if user is not logged in", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(<DashboardPage />);
    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });

  test("renders renter panel dashboard by default", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { userId: "renter-uuid", email: "renter@example.com", role: "USER" },
      token: "mock-jwt-token",
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    vi.mocked(global.fetch).mockImplementation(async (url: any) => {
      if (url.includes("role=renter")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            stats: { totalSpent: 12500, activeBookingsCount: 2 },
            bookings: [
              {
                id: "booking-1",
                startDate: "2026-07-10T00:00:00.000Z",
                endDate: "2026-07-12T00:00:00.000Z",
                totalPrice: 10000,
                status: "PAID",
                car: { make: "Toyota", model: "Corolla" },
              },
            ],
          }),
        } as any;
      } else {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            stats: { totalEarnings: 0, pendingApprovalsCount: 0, carsCount: 0 },
            bookings: [],
            cars: [],
          }),
        } as any;
      }
    });

    await act(async () => {
      render(<DashboardPage />);
    });

    expect(screen.getByText("My Rentals (Renter Mode)")).toBeDefined();
    expect(screen.getByText("Spent on Rentals")).toBeDefined();
    expect(screen.getByText("Rs. 12,500")).toBeDefined();
    expect(screen.getByText("Toyota Corolla")).toBeDefined();
    expect(screen.queryByText("My Vehicles (Owner Mode)")).toBeNull();
  });

  test("toggles to owner panel view correctly", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { userId: "owner-uuid", email: "owner@example.com", role: "USER" },
      token: "mock-jwt-token",
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    vi.mocked(global.fetch).mockImplementation(async (url: any) => {
      if (url.includes("role=renter")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            stats: { totalSpent: 0, activeBookingsCount: 0 },
            bookings: [],
          }),
        } as any;
      } else {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            stats: { totalEarnings: 45000, pendingApprovalsCount: 1, carsCount: 2 },
            bookings: [
              {
                id: "booking-2",
                startDate: "2026-07-15T00:00:00.000Z",
                endDate: "2026-07-17T00:00:00.000Z",
                totalPrice: 15000,
                status: "PENDING_APPROVAL",
                car: { make: "Honda", model: "Civic" },
                renter: { name: "Ali Khan" },
              },
            ],
            cars: [
              { id: "car-1", make: "Honda", model: "Civic", plateNumber: "AAA-1122" },
            ],
          }),
        } as any;
      }
    });

    await act(async () => {
      render(<DashboardPage />);
    });

    const toggleButton = screen.getByRole("button", { name: /Switch to Owner/i });
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    expect(screen.getByText("My Vehicles (Owner Mode)")).toBeDefined();
    expect(screen.getByText("Total Earnings")).toBeDefined();
    expect(screen.getByText("Rs. 45,000")).toBeDefined();
    expect(screen.getByText("Listed Cars")).toBeDefined();
    expect(screen.getByText("Pending Approvals")).toBeDefined();
    expect(screen.getAllByText("Honda Civic")).toBeDefined();
  });
});
