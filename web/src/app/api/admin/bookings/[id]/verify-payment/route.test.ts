import { expect, test, describe, vi, beforeEach } from "vitest";
import { PATCH } from "./route";
import { prisma } from "../../../../../../lib/prisma";
import { signJwt } from "../../../../../../lib/auth";

vi.mock("../../../../../../lib/prisma", () => {
  return {
    prisma: {
      booking: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe("PATCH /api/admin/bookings/:id/verify-payment", () => {
  const jwtSecret = "test-jwt-secret-key-32-characters";
  const bookingId = "booking-uuid";

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
    const req = new Request(`http://localhost/api/admin/bookings/${bookingId}/verify-payment`, {
      method: "PATCH",
      body: JSON.stringify({ status: "PAID" }),
    });

    const response = await PATCH(req, { params: { id: bookingId } });
    expect(response.status).toBe(401);
  });

  test("returns 403 if user is not an ADMIN", async () => {
    const req = new Request(`http://localhost/api/admin/bookings/${bookingId}/verify-payment`, {
      method: "PATCH",
      body: JSON.stringify({ status: "PAID" }),
      headers: {
        ...getAuthHeader("user-uuid", "USER"),
      },
    });

    const response = await PATCH(req, { params: { id: bookingId } });
    expect(response.status).toBe(403);
  });

  test("returns 404 if booking is not found", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);

    const req = new Request(`http://localhost/api/admin/bookings/${bookingId}/verify-payment`, {
      method: "PATCH",
      body: JSON.stringify({ status: "PAID" }),
      headers: {
        ...getAuthHeader("admin-uuid", "ADMIN"),
      },
    });

    const response = await PATCH(req, { params: { id: bookingId } });
    expect(response.status).toBe(404);
  });

  test("returns 400 if booking is not in PENDING_PAYMENT status or is not IBFT", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "PAID", // Already paid
      paymentMethod: "IBFT",
    } as any);

    const req = new Request(`http://localhost/api/admin/bookings/${bookingId}/verify-payment`, {
      method: "PATCH",
      body: JSON.stringify({ status: "PAID" }),
      headers: {
        ...getAuthHeader("admin-uuid", "ADMIN"),
      },
    });

    const response = await PATCH(req, { params: { id: bookingId } });
    expect(response.status).toBe(400);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  test("returns 400 if body status is invalid (not PAID or CANCELLED)", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "PENDING_PAYMENT",
      paymentMethod: "IBFT",
    } as any);

    const req = new Request(`http://localhost/api/admin/bookings/${bookingId}/verify-payment`, {
      method: "PATCH",
      body: JSON.stringify({ status: "PENDING_APPROVAL" }), // Invalid target status
      headers: {
        ...getAuthHeader("admin-uuid", "ADMIN"),
      },
    });

    const response = await PATCH(req, { params: { id: bookingId } });
    expect(response.status).toBe(400);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  test("successfully updates booking status to PAID when approved", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "PENDING_PAYMENT",
      paymentMethod: "IBFT",
    } as any);

    vi.mocked(prisma.booking.update).mockImplementation(async (args: any) => {
      return { id: bookingId, ...args.data };
    });

    const req = new Request(`http://localhost/api/admin/bookings/${bookingId}/verify-payment`, {
      method: "PATCH",
      body: JSON.stringify({ status: "PAID" }),
      headers: {
        ...getAuthHeader("admin-uuid", "ADMIN"),
      },
    });

    const response = await PATCH(req, { params: { id: bookingId } });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.booking.status).toBe("PAID");
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: bookingId },
      data: { status: "PAID" },
    });
  });
});
