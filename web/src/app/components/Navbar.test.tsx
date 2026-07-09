// @vitest-environment jsdom
import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import Navbar from "./Navbar";
import { useAuth } from "../../lib/AuthContext";

vi.mock("../../lib/AuthContext", () => {
  return {
    useAuth: vi.fn(),
  };
});

describe("Navbar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test("renders sign in and register buttons when logged out", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(<Navbar />);

    expect(screen.getByText("Chalao")).toBeDefined();
    expect(screen.getByText("Browse")).toBeDefined();
    expect(screen.getByText("Sign In")).toBeDefined();
    expect(screen.getByText("Register")).toBeDefined();
  });

  test("renders user email, dashboard, and log out button when logged in", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { userId: "user-123", email: "renter@example.com", role: "USER" },
      token: "mock-token",
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(<Navbar />);

    expect(screen.queryByText("Sign In")).toBeNull();
    expect(screen.getByText("renter@example.com")).toBeDefined();
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Log Out")).toBeDefined();
    expect(screen.queryByText("Admin Console")).toBeNull();
  });

  test("renders admin console link for ADMIN role", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { userId: "admin-123", email: "admin@example.com", role: "ADMIN" },
      token: "mock-token",
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(<Navbar />);

    expect(screen.getByText("Admin Console")).toBeDefined();
  });
});
