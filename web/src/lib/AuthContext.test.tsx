// @vitest-environment jsdom
import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";

// Simple test consumer component
const TestConsumer = () => {
  const { user, login, logout, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <span data-testid="status">{user ? `logged-in:${user.email}:${user.role}` : "logged-out"}</span>
      <button data-testid="login-btn" onClick={() => login("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImV4cCI6OTk5OTk5OTk5OX0.signature")}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test("initial state is logged out when no token in localStorage", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(await screen.findByTestId("status")).toBeDefined();
    expect(screen.getByTestId("status").textContent).toBe("logged-out");
  });

  test("logs in user and decodes token successfully", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(await screen.findByTestId("status")).toBeDefined();
    const loginButton = screen.getByTestId("login-btn");
    
    await act(async () => {
      loginButton.click();
    });

    expect(screen.getByTestId("status").textContent).toBe("logged-in:test@example.com:USER");
    expect(localStorage.getItem("token")).toContain("eyJhbGci");
  });

  test("logs out user and clears storage successfully", async () => {
    // Put token in localStorage first
    localStorage.setItem(
      "token",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImV4cCI6OTk5OTk5OTk5OX0.signature"
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(await screen.findByTestId("status")).toBeDefined();
    expect(screen.getByTestId("status").textContent).toBe("logged-in:test@example.com:USER");

    const logoutButton = screen.getByTestId("logout-btn");
    await act(async () => {
      logoutButton.click();
    });

    expect(screen.getByTestId("status").textContent).toBe("logged-out");
    expect(localStorage.getItem("token")).toBeNull();
  });
});
