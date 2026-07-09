import { expect, test, describe, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { prisma } from "../../../../lib/prisma";
import { signJwt } from "../../../../lib/auth";

vi.mock("../../../../lib/prisma", () => {
  return {
    prisma: {
      booking: {
        findMany: vi.fn(),
      },
    },
  };
});

describe("GET /api/admin/bookings", () => {
  const jwtSecret = "test-jwt-secret-key-32-characters";

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
    const req = new Request("http://localhost/api/admin/bookings", {
      method: "GET",
    });

    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  test("returns 403 if user is not an ADMIN", async () => {
    const req = new Request("http://localhost/api/admin/bookings", {
      method: "GET",
      headers: {
        ...getAuthHeader("user-uuid", "USER"),
      },
    });

    const response = await GET(req);
    expect(response.status).toBe(403);
  });

  test("successfully returns list of bookings pending payment review for ADMIN", async () => {
    const mockBookings = [
      {
        id: "booking-1",
        status: "PENDING_PAYMENT",
        paymentMethod: "IBFT",
        paymentReceipt: "receipts/ibft-1.png",
        renter: { id: "renter-1", name: "Renter 1" },
        car: { id: "car-1", make: "Toyota", ownerId: "owner-1" },
      },
    ];

    vi.mocked(prisma.booking.findMany).mockResolvedValue(mockBookings as any);

    const req = new Request("http://localhost/api/admin/bookings", {
      method: "GET",
      headers: {
        ...getAuthHeader("admin-uuid", "ADMIN"),
      },
    });

    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.bookings).toHaveLength(1);
    expect(body.bookings[0].id).toBe("booking-1");

    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: {
        paymentMethod: "IBFT",
        status: "PENDING_PAYMENT",
      },
      include: {
        renter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        car: {
          include: {
            owner: {
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
