// @vitest-environment jsdom
import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import CreateCarPage from "./page";
import { AuthProvider, useAuth } from "../../../lib/AuthContext";

const mockPush = vi.fn();
vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

vi.mock("../../../lib/AuthContext", () => {
  const actual = vi.importActual("../../../lib/AuthContext");
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

describe("Create Car Listing Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  test("redirects to login if user is not authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(<CreateCarPage />);

    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });

  test("renders all listing creation inputs for authenticated owner", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { userId: "owner-id", email: "owner@example.com", role: "USER" },
      token: "mock-jwt-token",
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(<CreateCarPage />);

    expect(screen.getByLabelText("Make")).toBeDefined();
    expect(screen.getByLabelText("Model")).toBeDefined();
    expect(screen.getByLabelText("Year")).toBeDefined();
    expect(screen.getByLabelText("Plate Number")).toBeDefined();
    expect(screen.getByLabelText("City")).toBeDefined();
    expect(screen.getByLabelText("Base Daily Price (Rs.)")).toBeDefined();
    expect(screen.getByRole("button", { name: "Create Listing" })).toBeDefined();
  });

  test("handles submission and sends post request successfully", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { userId: "owner-id", email: "owner@example.com", role: "USER" },
      token: "mock-jwt-token",
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ car: { id: "new-car-id" } }),
    } as any);

    render(<CreateCarPage />);

    fireEvent.change(screen.getByLabelText("Make"), { target: { value: "Honda" } });
    fireEvent.change(screen.getByLabelText("Model"), { target: { value: "Civic" } });
    fireEvent.change(screen.getByLabelText("Year"), { target: { value: "2023" } });
    fireEvent.change(screen.getByLabelText("Plate Number"), { target: { value: "AEX-9988" } });
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "ISLAMABAD" } });
    fireEvent.change(screen.getByLabelText("Base Daily Price (Rs.)"), { target: { value: "7000" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create Listing" }));
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/cars",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-jwt-token",
        }),
      })
    );
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
