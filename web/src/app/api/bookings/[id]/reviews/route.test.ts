import { expect, test, describe, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { prisma } from "../../../../../lib/prisma";
import { signJwt } from "../../../../../lib/auth";

vi.mock("../../../../../lib/prisma", () => {
  return {
    prisma: {
      booking: {
        findUnique: vi.fn(),
      },
      review: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

describe("POST /api/bookings/:id/reviews", () => {
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

  test("allows renter to review the owner/car successfully", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "COMPLETED",
      renterId: "renter-uuid",
      car: { ownerId: "owner-uuid" },
    } as any);

    vi.mocked(prisma.review.findFirst).mockResolvedValue(null);

    vi.mocked(prisma.review.create).mockImplementation(async (args: any) => {
      return { id: "review-uuid", ...args.data };
    });

    const req = new Request(`http://localhost/api/bookings/${bookingId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ rating: 5, comment: "Awesome car and smooth checkout!" }),
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.review.id).toBe("review-uuid");
    expect(body.review.reviewerId).toBe("renter-uuid");
    expect(body.review.revieweeId).toBe("owner-uuid");
    expect(body.review.rating).toBe(5);
  });

  test("allows owner to review the renter successfully", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "COMPLETED",
      renterId: "renter-uuid",
      car: { ownerId: "owner-uuid" },
    } as any);

    vi.mocked(prisma.review.findFirst).mockResolvedValue(null);

    vi.mocked(prisma.review.create).mockImplementation(async (args: any) => {
      return { id: "review-uuid", ...args.data };
    });

    const req = new Request(`http://localhost/api/bookings/${bookingId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ rating: 4, comment: "Responsible renter, drove carefully." }),
      headers: {
        ...getAuthHeader("owner-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.review.reviewerId).toBe("owner-uuid");
    expect(body.review.revieweeId).toBe("renter-uuid");
    expect(body.review.rating).toBe(4);
  });

  test("returns 400 for invalid ratings", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "COMPLETED",
      renterId: "renter-uuid",
      car: { ownerId: "owner-uuid" },
    } as any);

    const req = new Request(`http://localhost/api/bookings/${bookingId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ rating: 6 }), // Invalid rating > 5
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(400);
  });

  test("returns 400 if duplicate review is submitted", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "COMPLETED",
      renterId: "renter-uuid",
      car: { ownerId: "owner-uuid" },
    } as any);

    vi.mocked(prisma.review.findFirst).mockResolvedValue({ id: "existing-review" } as any);

    const req = new Request(`http://localhost/api/bookings/${bookingId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ rating: 5 }),
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(400);
    expect(prisma.review.create).not.toHaveBeenCalled();
  });
});
