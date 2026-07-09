// @vitest-environment jsdom
import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import React from "react";
import RegisterPage from "./page";
import { AuthProvider } from "../../../lib/AuthContext";

const mockPush = vi.fn();
vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

describe("RegisterPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  test("renders registration input fields and submit button", () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );

    expect(screen.getByLabelText("Full Name")).toBeDefined();
    expect(screen.getByLabelText("Email Address")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(screen.getByRole("button", { name: "Create Account" })).toBeDefined();
  });

  test("handles submission and registers successfully, navigating to login", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ message: "User registered successfully." }),
    } as any);

    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "Ali Khan" },
    });
    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "ali@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "mypassword123" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/register", expect.any(Object));
    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });

  test("displays error message upon registration failure", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Email already registered." }),
    } as any);

    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "Ali Khan" },
    });
    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "ali@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "mypassword123" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
    });

    expect(await screen.findByText("Email already registered.")).toBeDefined();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
