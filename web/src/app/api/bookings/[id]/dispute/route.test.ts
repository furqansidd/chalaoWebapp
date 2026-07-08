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
      dispute: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

describe("POST /api/bookings/:id/dispute", () => {
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

  test("allows renter of the booking to raise a dispute", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      renterId: "renter-uuid",
      car: { ownerId: "owner-uuid" },
    } as any);

    vi.mocked(prisma.dispute.findUnique).mockResolvedValue(null); // No existing dispute

    vi.mocked(prisma.dispute.create).mockImplementation(async (args: any) => {
      return { id: "dispute-uuid", ...args.data };
    });

    const req = new Request(`http://localhost/api/bookings/${bookingId}/dispute`, {
      method: "POST",
      body: JSON.stringify({ reason: "Accidental scratch by owner before rental start" }),
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.dispute.id).toBe("dispute-uuid");
    expect(body.dispute.raisedById).toBe("renter-uuid");
    expect(body.dispute.reason).toBe("Accidental scratch by owner before rental start");
  });

  test("allows owner of the car to raise a dispute", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      renterId: "renter-uuid",
      car: { ownerId: "owner-uuid" },
    } as any);

    vi.mocked(prisma.dispute.findUnique).mockResolvedValue(null);

    vi.mocked(prisma.dispute.create).mockImplementation(async (args: any) => {
      return { id: "dispute-uuid", ...args.data };
    });

    const req = new Request(`http://localhost/api/bookings/${bookingId}/dispute`, {
      method: "POST",
      body: JSON.stringify({ reason: "Renter returned vehicle with low fuel and minor dents" }),
      headers: {
        ...getAuthHeader("owner-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.dispute.raisedById).toBe("owner-uuid");
  });

  test("returns 403 if third party user attempts to raise dispute", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      renterId: "renter-uuid",
      car: { ownerId: "owner-uuid" },
    } as any);

    const req = new Request(`http://localhost/api/bookings/${bookingId}/dispute`, {
      method: "POST",
      body: JSON.stringify({ reason: "Attacker attempts dispute" }),
      headers: {
        ...getAuthHeader("attacker-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(403);
  });

  test("returns 400 if a dispute has already been filed for the booking", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      renterId: "renter-uuid",
      car: { ownerId: "owner-uuid" },
    } as any);

    vi.mocked(prisma.dispute.findUnique).mockResolvedValue({ id: "existing-dispute" } as any);

    const req = new Request(`http://localhost/api/bookings/${bookingId}/dispute`, {
      method: "POST",
      body: JSON.stringify({ reason: "Duplicate dispute" }),
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(400);
    expect(prisma.dispute.create).not.toHaveBeenCalled();
  });
});
