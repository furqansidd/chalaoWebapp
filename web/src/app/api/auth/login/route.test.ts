import { expect, test, describe, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcrypt";

vi.mock("../../../../lib/prisma", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
    },
  };
});

describe("POST /api/auth/login", () => {
  const password = "mysecretpassword123";
  let passwordHash = "";

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-jwt-secret-key-32-characters";
    passwordHash = await bcrypt.hash(password, 10);
  });

  test("authenticates user successfully with correct credentials", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-uuid",
      email: "test@example.com",
      passwordHash,
      name: "Ali Khan",
      role: "USER",
    } as any);

    const requestBody = {
      email: "test@example.com",
      password: "mysecretpassword123",
    };

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.user.id).toBe("user-uuid");
    expect(body.user.email).toBe("test@example.com");
    expect(body.user.passwordHash).toBeUndefined(); // Password hash must be removed
    expect(body.token).toBeDefined(); // Mock token returned
  });

  test("returns 401 for incorrect password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-uuid",
      email: "test@example.com",
      passwordHash,
      name: "Ali Khan",
    } as any);

    const requestBody = {
      email: "test@example.com",
      password: "wrongpassword",
    };

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toContain("Invalid email or password");
  });

  test("returns 401 for non-existent email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const requestBody = {
      email: "nonexistent@example.com",
      password: "somepassword",
    };

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toContain("Invalid email or password");
  });

  test("returns 400 for missing request parameters", async () => {
    const requestBody = {
      email: "test@example.com",
    };

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain("Email and password are required");
  });
});
