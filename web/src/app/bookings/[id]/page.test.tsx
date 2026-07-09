// @vitest-environment jsdom
import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import BookingDetailPage from "./page";
import { AuthProvider, useAuth } from "../../../lib/AuthContext";

const mockPush = vi.fn();
vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

vi.mock("../../../lib/AuthContext", async () => {
  const actual = await vi.importActual<any>("../../../lib/AuthContext");
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

describe("Booking Details Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  test("renders booking details correctly for a renter", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { userId: "renter-uuid", email: "renter@example.com", role: "USER" },
      token: "mock-jwt-token",
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    const mockBooking = {
      id: "booking-uuid",
      startDate: "2026-07-10T00:00:00.000Z",
      endDate: "2026-07-12T00:00:00.000Z",
      status: "PENDING_APPROVAL",
      totalPrice: 10000,
      securityDeposit: 5000,
      car: {
        id: "car-1",
        make: "Toyota",
        model: "Corolla",
        year: 2021,
        plateNumber: "LEB-1111",
        city: "LAHORE",
        basePrice: 5000,
      },
      renter: { name: "Ali Khan", email: "renter@example.com" },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ booking: mockBooking }),
    } as any);

    await act(async () => {
      render(
        <AuthProvider>
          <BookingDetailPage params={{ id: "booking-uuid" }} />
        </AuthProvider>
      );
    });

    expect(screen.getByText("Booking Details")).toBeDefined();
    expect(screen.getByText("Toyota Corolla")).toBeDefined();
    expect(screen.getByText(/Rs. 10,000/)).toBeDefined();
    expect(screen.getAllByText(/5,000/)).toBeDefined();
    expect(screen.getByText("PENDING APPROVAL")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Approve Booking" })).toBeNull(); // Renter cannot approve
  });

  test("renders owner approval actions if logged in as car owner", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { userId: "owner-uuid", email: "owner@example.com", role: "USER" },
      token: "mock-jwt-token",
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    const mockBooking = {
      id: "booking-uuid",
      startDate: "2026-07-10T00:00:00.000Z",
      endDate: "2026-07-12T00:00:00.000Z",
      status: "PENDING_APPROVAL",
      totalPrice: 10000,
      securityDeposit: 5000,
      car: {
        id: "car-1",
        make: "Toyota",
        model: "Corolla",
        ownerId: "owner-uuid",
        year: 2021,
        plateNumber: "LEB-1111",
      },
      renter: { name: "Ali Khan", email: "renter@example.com" },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ booking: mockBooking }),
    } as any);

    await act(async () => {
      render(
        <AuthProvider>
          <BookingDetailPage params={{ id: "booking-uuid" }} />
        </AuthProvider>
      );
    });

    expect(screen.getByRole("button", { name: "Approve Booking" })).toBeDefined();
  });
});
