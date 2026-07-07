import { expect, test, describe, vi, beforeEach } from "vitest";
import { PATCH } from "./route";
import { prisma } from "../../../../../lib/prisma";
import { signJwt } from "../../../../../lib/auth";

vi.mock("../../../../../lib/prisma", () => {
  return {
    prisma: {
      booking: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe("PATCH /api/bookings/:id/approve", () => {
  const jwtSecret = "test-jwt-secret-key-32-characters";
  const bookingId = "booking-uuid";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = jwtSecret;
  });

  const getAuthHeader = (userId: string) => {
    const token = signJwt(
      { userId, email: "user@example.com", role: "USER" },
      jwtSecret
    );
    return { Authorization: `Bearer ${token}` };
  };

  test("allows owner of the car to approve the booking", async () => {
    // Mock booking structure with associated car owner ID
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "PENDING_APPROVAL",
      car: {
        ownerId: "owner-uuid",
      },
    } as any);

    vi.mocked(prisma.booking.update).mockImplementation(async (args: any) => {
      return { id: bookingId, ...args.data };
    });

    const req = new Request(`http://localhost/api/bookings/${bookingId}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ approved: true }),
      headers: {
        ...getAuthHeader("owner-uuid"),
      },
    });

    const response = await PATCH(req, { params: { id: bookingId } });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.booking.status).toBe("PENDING_PAYMENT");
    expect(prisma.booking.update).toHaveBeenCalledTimes(1);
  });

  test("allows owner of the car to reject the booking with reason", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "PENDING_APPROVAL",
      car: {
        ownerId: "owner-uuid",
      },
    } as any);

    vi.mocked(prisma.booking.update).mockImplementation(async (args: any) => {
      return { id: bookingId, ...args.data };
    });

    const req = new Request(`http://localhost/api/bookings/${bookingId}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ approved: false, reason: "Vehicle in workshop" }),
      headers: {
        ...getAuthHeader("owner-uuid"),
      },
    });

    const response = await PATCH(req, { params: { id: bookingId } });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.booking.status).toBe("CANCELLED");
    expect(body.booking.cancellationReason).toBe("Vehicle in workshop");
  });

  test("returns 403 if non-owner tries to approve the booking", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "PENDING_APPROVAL",
      car: {
        ownerId: "owner-uuid",
      },
    } as any);

    const req = new Request(`http://localhost/api/bookings/${bookingId}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ approved: true }),
      headers: {
        ...getAuthHeader("attacker-uuid"), // Attacker is not the owner
      },
    });

    const response = await PATCH(req, { params: { id: bookingId } });
    expect(response.status).toBe(403);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  test("returns 404 if booking is not found", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);

    const req = new Request(`http://localhost/api/bookings/${bookingId}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ approved: true }),
      headers: {
        ...getAuthHeader("owner-uuid"),
      },
    });

    const response = await PATCH(req, { params: { id: bookingId } });
    expect(response.status).toBe(404);
  });
});
