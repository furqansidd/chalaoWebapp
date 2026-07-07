import { expect, test, describe, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcrypt";
import { decrypt } from "../../../../lib/encryption";

// Mock the global Prisma Client
vi.mock("../../../../lib/prisma", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

describe("POST /api/auth/register", () => {
  const encryptionKey = "42424242424242424242424242424242";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENCRYPTION_KEY = encryptionKey;
  });

  test("registers user successfully with password hashing and PII encryption", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    
    let createdUser: any = null;
    vi.mocked(prisma.user.create).mockImplementation(async (args: any) => {
      createdUser = { id: "user-uuid", ...args.data };
      return createdUser;
    });

    const requestBody = {
      email: "test@example.com",
      password: "securepassword123",
      name: "Ali Khan",
      cnicNumber: "42101-1234567-1",
      drivingLicense: "DL-999888",
    };

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
    
    const body = await response.json();
    expect(body.user.id).toBe("user-uuid");
    expect(body.user.email).toBe("test@example.com");
    expect(body.user.passwordHash).toBeUndefined(); // Should not return password/hash

    // Verify Prisma create was called
    expect(prisma.user.create).toHaveBeenCalledTimes(1);

    // Verify Password was hashed
    expect(createdUser.passwordHash).not.toBe(requestBody.password);
    const isPasswordMatch = await bcrypt.compare(requestBody.password, createdUser.passwordHash);
    expect(isPasswordMatch).toBe(true);

    // Verify PII fields were encrypted
    expect(createdUser.cnicNumber).not.toBe(requestBody.cnicNumber);
    expect(createdUser.drivingLicense).not.toBe(requestBody.drivingLicense);
    
    expect(decrypt(createdUser.cnicNumber)).toBe(requestBody.cnicNumber);
    expect(decrypt(createdUser.drivingLicense)).toBe(requestBody.drivingLicense);
  });

  test("returns 400 if user email already exists", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "existing-user-uuid",
      email: "test@example.com",
    } as any);

    const requestBody = {
      email: "test@example.com",
      password: "securepassword123",
      name: "Ali Khan",
    };

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain("already exists");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  test("returns 400 for missing mandatory fields", async () => {
    const requestBody = {
      email: "test@example.com",
    };

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain("Missing required fields");
  });
});
