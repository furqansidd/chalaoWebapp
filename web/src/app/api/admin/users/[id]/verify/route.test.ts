import { expect, test, describe, vi, beforeEach } from "vitest";
import { PATCH } from "./route";
import { prisma } from "../../../../../../lib/prisma";
import { signJwt } from "../../../../../../lib/auth";

vi.mock("../../../../../../lib/prisma", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe("PATCH /api/admin/users/:id/verify", () => {
  const jwtSecret = "test-jwt-secret-key-32-characters";
  const targetUserId = "target-user-uuid";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = jwtSecret;
  });

  const getAuthHeader = (userId: string, role: string) => {
    const token = signJwt(
      { userId, email: "admin@example.com", role },
      jwtSecret
    );
    return { Authorization: `Bearer ${token}` };
  };

  test("returns 401 if unauthorized (no token)", async () => {
    const req = new Request(`http://localhost/api/admin/users/${targetUserId}/verify`, {
      method: "PATCH",
    });

    const response = await PATCH(req, { params: { id: targetUserId } });
    expect(response.status).toBe(401);
  });

  test("returns 403 if user is not an ADMIN", async () => {
    const req = new Request(`http://localhost/api/admin/users/${targetUserId}/verify`, {
      method: "PATCH",
      headers: {
        ...getAuthHeader("user-uuid", "USER"),
      },
    });

    const response = await PATCH(req, { params: { id: targetUserId } });
    expect(response.status).toBe(403);
  });

  test("returns 404 if user not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = new Request(`http://localhost/api/admin/users/${targetUserId}/verify`, {
      method: "PATCH",
      headers: {
        ...getAuthHeader("admin-uuid", "ADMIN"),
      },
    });

    const response = await PATCH(req, { params: { id: targetUserId } });
    expect(response.status).toBe(404);
  });

  test("successfully sets isVerified = true for target user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: targetUserId,
      email: "user@example.com",
      isVerified: false,
    } as any);

    vi.mocked(prisma.user.update).mockImplementation(async (args: any) => {
      return { id: targetUserId, ...args.data };
    });

    const req = new Request(`http://localhost/api/admin/users/${targetUserId}/verify`, {
      method: "PATCH",
      headers: {
        ...getAuthHeader("admin-uuid", "ADMIN"),
      },
    });

    const response = await PATCH(req, { params: { id: targetUserId } });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.user.isVerified).toBe(true);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: targetUserId },
      data: { isVerified: true },
    });
  });
});
