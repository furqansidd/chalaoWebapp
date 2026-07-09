// @vitest-environment jsdom
import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import BrowsePage from "./page";
import { AuthProvider } from "../lib/AuthContext";

describe("Car Browse & Search Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  test("renders search parameters controls and lists default cars", async () => {
    const mockCars = [
      { id: "car-1", make: "Toyota", model: "Corolla", basePrice: 5000, city: "KARACHI" },
      { id: "car-2", make: "Honda", model: "Civic", basePrice: 6000, city: "LAHORE" },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ cars: mockCars }),
    } as any);

    await act(async () => {
      render(
        <AuthProvider>
          <BrowsePage />
        </AuthProvider>
      );
    });

    expect(screen.getByLabelText("Select City")).toBeDefined();
    expect(screen.getByLabelText("Start Date")).toBeDefined();
    expect(screen.getByLabelText("End Date")).toBeDefined();
    expect(screen.getByRole("button", { name: "Search Cars" })).toBeDefined();

    // Verify default list of cars renders
    expect(await screen.findByText("Toyota Corolla")).toBeDefined();
    expect(await screen.findByText("Honda Civic")).toBeDefined();
    expect(global.fetch).toHaveBeenCalledWith("/api/cars", expect.any(Object));
  });

  test("performs filtered search upon form submission", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ cars: [] }),
    } as any);

    await act(async () => {
      render(
        <AuthProvider>
          <BrowsePage />
        </AuthProvider>
      );
    });

    fireEvent.change(screen.getByLabelText("Select City"), {
      target: { value: "KARACHI" },
    });
    fireEvent.change(screen.getByLabelText("Start Date"), {
      target: { value: "2026-08-10" },
    });
    fireEvent.change(screen.getByLabelText("End Date"), {
      target: { value: "2026-08-15" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Search Cars" }));
    });

    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("/api/cars?city=KARACHI&startDate=2026-08-10T00%3A00%3A00.000Z&endDate=2026-08-15T23%3A59%3A59.000Z"),
      expect.any(Object)
    );
  });
});
