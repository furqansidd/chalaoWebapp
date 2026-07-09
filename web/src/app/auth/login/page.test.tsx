// @vitest-environment jsdom
import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import LoginPage from "./page";
import { AuthProvider } from "../../../lib/AuthContext";

const mockPush = vi.fn();
vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

describe("LoginPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  test("renders email and password inputs and a submit button", () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    expect(screen.getByLabelText("Email Address")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeDefined();
  });

  test("handles submission and logs in successfully", async () => {
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImV4cCI6OTk5OTk5OTk5OX0.signature";
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: mockToken, user: { email: "test@example.com" } }),
    } as any);

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", expect.any(Object));
    expect(localStorage.getItem("token")).toBe(mockToken);
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  test("displays error message upon API failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Invalid email or password." }),
    } as any);

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpassword" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    });

    expect(await screen.findByText("Invalid email or password.")).toBeDefined();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
