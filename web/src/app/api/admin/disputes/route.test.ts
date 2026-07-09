import { expect, test, describe, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { PATCH } from "./[id]/route";
import { prisma } from "../../../../lib/prisma";
import { signJwt } from "../../../../lib/auth";

vi.mock("../../../../lib/prisma", () => {
  return {
    prisma: {
      dispute: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe("Admin Dispute Management APIs", () => {
  const jwtSecret = "test-jwt-secret-key-32-characters";
  const disputeId = "dispute-uuid";

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

  describe("GET /api/admin/disputes", () => {
    test("returns 401 if unauthorized (no token)", async () => {
      const req = new Request("http://localhost/api/admin/disputes", {
        method: "GET",
      });

      const response = await GET(req);
      expect(response.status).toBe(401);
    });

    test("returns 403 if user is not an ADMIN", async () => {
      const req = new Request("http://localhost/api/admin/disputes", {
        method: "GET",
        headers: {
          ...getAuthHeader("user-uuid", "USER"),
        },
      });

      const response = await GET(req);
      expect(response.status).toBe(403);
    });

    test("successfully retrieves all disputes for ADMIN", async () => {
      const mockDisputes = [
        {
          id: "dispute-1",
          status: "OPEN",
          reason: "Scratch on bumper",
          raisedBy: { id: "user-1", name: "Renter Name" },
          booking: { id: "booking-1" },
        },
      ];

      vi.mocked(prisma.dispute.findMany).mockResolvedValue(mockDisputes as any);

      const req = new Request("http://localhost/api/admin/disputes", {
        method: "GET",
        headers: {
          ...getAuthHeader("admin-uuid", "ADMIN"),
        },
      });

      const response = await GET(req);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.disputes).toHaveLength(1);
      expect(body.disputes[0].id).toBe("dispute-1");
      expect(prisma.dispute.findMany).toHaveBeenCalledWith({
        include: {
          raisedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          booking: {
            include: {
              car: true,
              renter: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("PATCH /api/admin/disputes/:id", () => {
    test("returns 401 if unauthorized (no token)", async () => {
      const req = new Request(`http://localhost/api/admin/disputes/${disputeId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "RESOLVED" }),
      });

      const response = await PATCH(req, { params: { id: disputeId } });
      expect(response.status).toBe(401);
    });

    test("returns 403 if user is not an ADMIN", async () => {
      const req = new Request(`http://localhost/api/admin/disputes/${disputeId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "RESOLVED" }),
        headers: {
          ...getAuthHeader("user-uuid", "USER"),
        },
      });

      const response = await PATCH(req, { params: { id: disputeId } });
      expect(response.status).toBe(403);
    });

    test("returns 404 if dispute not found", async () => {
      vi.mocked(prisma.dispute.findUnique).mockResolvedValue(null);

      const req = new Request(`http://localhost/api/admin/disputes/${disputeId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "RESOLVED" }),
        headers: {
          ...getAuthHeader("admin-uuid", "ADMIN"),
        },
      });

      const response = await PATCH(req, { params: { id: disputeId } });
      expect(response.status).toBe(404);
    });

    test("returns 400 if status body parameter is invalid (not RESOLVED or DISMISSED)", async () => {
      vi.mocked(prisma.dispute.findUnique).mockResolvedValue({
        id: disputeId,
        status: "OPEN",
      } as any);

      const req = new Request(`http://localhost/api/admin/disputes/${disputeId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "OPEN" }), // Invalid transition/target
        headers: {
          ...getAuthHeader("admin-uuid", "ADMIN"),
        },
      });

      const response = await PATCH(req, { params: { id: disputeId } });
      expect(response.status).toBe(400);
      expect(prisma.dispute.update).not.toHaveBeenCalled();
    });

    test("successfully updates dispute status to RESOLVED", async () => {
      vi.mocked(prisma.dispute.findUnique).mockResolvedValue({
        id: disputeId,
        status: "OPEN",
      } as any);

      vi.mocked(prisma.dispute.update).mockImplementation(async (args: any) => {
        return { id: disputeId, ...args.data };
      });

      const req = new Request(`http://localhost/api/admin/disputes/${disputeId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "RESOLVED" }),
        headers: {
          ...getAuthHeader("admin-uuid", "ADMIN"),
        },
      });

      const response = await PATCH(req, { params: { id: disputeId } });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.dispute.status).toBe("RESOLVED");
      expect(prisma.dispute.update).toHaveBeenCalledWith({
        where: { id: disputeId },
        data: { status: "RESOLVED" },
      });
    });
  });
});
