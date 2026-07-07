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

describe("POST /api/bookings/:id/checkout", () => {
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

  test("allows renter of the booking to upload post-trip photos and checkout successfully", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "CHECKED_IN",
      renterId: "renter-uuid",
      preTripPhotos: {
        front: "pre-front.jpg",
        back: "pre-back.jpg",
        left: "pre-left.jpg",
        right: "pre-right.jpg",
        interior: "pre-interior.jpg",
        odometer: "pre-odometer.jpg",
      },
    } as any);

    vi.mocked(prisma.booking.update).mockImplementation(async (args: any) => {
      return { id: bookingId, ...args.data };
    });

    const postTripPhotos = {
      front: "post-front.jpg",
      back: "post-back.jpg",
      left: "post-left.jpg",
      right: "post-right.jpg",
      interior: "post-interior.jpg",
      odometer: "post-odometer.jpg",
    };

    const req = new Request(`http://localhost/api/bookings/${bookingId}/checkout`, {
      method: "POST",
      body: JSON.stringify({ postTripPhotos }),
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.booking.status).toBe("CHECKED_OUT");
    expect(body.booking.postTripPhotos).toEqual(postTripPhotos);
    expect(prisma.booking.update).toHaveBeenCalledTimes(1);
  });

  test("returns 400 if any of the 6 required post-trip photo angles is missing", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "CHECKED_IN",
      renterId: "renter-uuid",
    } as any);

    const postTripPhotos = {
      front: "post-front.jpg",
      back: "post-back.jpg",
      // left is missing!
      right: "post-right.jpg",
      interior: "post-interior.jpg",
      odometer: "post-odometer.jpg",
    };

    const req = new Request(`http://localhost/api/bookings/${bookingId}/checkout`, {
      method: "POST",
      body: JSON.stringify({ postTripPhotos }),
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(400);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  test("returns 403 if non-renter tries to checkout", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "CHECKED_IN",
      renterId: "renter-uuid",
    } as any);

    const postTripPhotos = {
      front: "post-front.jpg",
      back: "post-back.jpg",
      left: "post-left.jpg",
      right: "post-right.jpg",
      interior: "post-interior.jpg",
      odometer: "post-odometer.jpg",
    };

    const req = new Request(`http://localhost/api/bookings/${bookingId}/checkout`, {
      method: "POST",
      body: JSON.stringify({ postTripPhotos }),
      headers: {
        ...getAuthHeader("attacker-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(403);
  });
});
