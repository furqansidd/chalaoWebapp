import { expect, test, describe, vi, beforeEach } from "vitest";
import { POST } from "./route";
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

describe("POST /api/bookings/:id/checkin", () => {
  const jwtSecret = "test-jwt-secret-key-32-characters";
  const bookingId = "booking-uuid";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = jwtSecret;
  });

  const getAuthHeader = (userId: string) => {
    const token = signJwt(
      { userId, email: "renter@example.com", role: "USER" },
      jwtSecret
    );
    return { Authorization: `Bearer ${token}` };
  };

  test("allows renter of the booking to upload pre-trip inspection photos and check in successfully", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "PAID",
      renterId: "renter-uuid",
    } as any);

    vi.mocked(prisma.booking.update).mockImplementation(async (args: any) => {
      return { id: bookingId, ...args.data };
    });

    const preTripPhotos = {
      front: "pre-front.jpg",
      back: "pre-back.jpg",
      left: "pre-left.jpg",
      right: "pre-right.jpg",
      interior: "pre-interior.jpg",
      odometer: "pre-odometer.jpg",
    };

    const req = new Request(`http://localhost/api/bookings/${bookingId}/checkin`, {
      method: "POST",
      body: JSON.stringify({ preTripPhotos }),
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.booking.status).toBe("CHECKED_IN");
    expect(body.booking.preTripPhotos).toEqual(preTripPhotos);
    expect(prisma.booking.update).toHaveBeenCalledTimes(1);
  });

  test("returns 400 if any of the 6 required photo angles is missing", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "PAID",
      renterId: "renter-uuid",
    } as any);

    const preTripPhotos = {
      front: "pre-front.jpg",
      back: "pre-back.jpg",
      // left is missing!
      right: "pre-right.jpg",
      interior: "pre-interior.jpg",
      odometer: "pre-odometer.jpg",
    };

    const req = new Request(`http://localhost/api/bookings/${bookingId}/checkin`, {
      method: "POST",
      body: JSON.stringify({ preTripPhotos }),
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(400);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  test("returns 403 if non-renter tries to check in", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "PAID",
      renterId: "renter-uuid",
    } as any);

    const preTripPhotos = {
      front: "pre-front.jpg",
      back: "pre-back.jpg",
      left: "pre-left.jpg",
      right: "pre-right.jpg",
      interior: "pre-interior.jpg",
      odometer: "pre-odometer.jpg",
    };

    const req = new Request(`http://localhost/api/bookings/${bookingId}/checkin`, {
      method: "POST",
      body: JSON.stringify({ preTripPhotos }),
      headers: {
        ...getAuthHeader("attacker-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(403);
  });
});
