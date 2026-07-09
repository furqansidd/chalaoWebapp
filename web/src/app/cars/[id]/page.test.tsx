// @vitest-environment jsdom
import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import CarDetailPage from "./page";
import { AuthProvider } from "../../../lib/AuthContext";

const mockPush = vi.fn();
vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

describe("Car Detail Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  test("renders car details correctly after fetching", async () => {
    const mockCar = {
      id: "car-uuid",
      make: "Honda",
      model: "Civic",
      year: 2022,
      plateNumber: "ABC-1234",
      city: "KARACHI",
      basePrice: 5000,
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ car: mockCar }),
    } as any);

    render(
      <AuthProvider>
        <CarDetailPage params={{ id: "car-uuid" }} />
      </AuthProvider>
    );

    // Should display loading state initially
    expect(screen.getByText("Loading vehicle details...")).toBeDefined();

    // Verify fetched car info renders
    expect(await screen.findByText("Honda Civic")).toBeDefined();
    expect(screen.getByText(/Plate Number: ABC-1234/)).toBeDefined();
    expect(screen.getByText(/Location: KARACHI/)).toBeDefined();
    expect(screen.getByText(/5,000 \/ day/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Book Ride" })).toBeDefined();
    expect(global.fetch).toHaveBeenCalledWith("/api/cars/car-uuid", expect.any(Object));
  });
});
