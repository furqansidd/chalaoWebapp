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

describe("POST /api/bookings/:id/pay", () => {
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

  test("allows renter of the booking to pay successfully using STRIPE", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "PENDING_PAYMENT",
      renterId: "renter-uuid",
      totalPrice: 25000,
    } as any);

    vi.mocked(prisma.booking.update).mockImplementation(async (args: any) => {
      return { id: bookingId, ...args.data };
    });

    const req = new Request(`http://localhost/api/bookings/${bookingId}/pay`, {
      method: "POST",
      body: JSON.stringify({ paymentMethod: "STRIPE" }),
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.booking.status).toBe("PAID");
    expect(prisma.booking.update).toHaveBeenCalledTimes(1);
  });

  test("allows renter to upload an IBFT receipt and keeps status as PENDING_PAYMENT for admin review", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "PENDING_PAYMENT",
      renterId: "renter-uuid",
      totalPrice: 25000,
    } as any);

    vi.mocked(prisma.booking.update).mockImplementation(async (args: any) => {
      return { id: bookingId, ...args.data };
    });

    const req = new Request(`http://localhost/api/bookings/${bookingId}/pay`, {
      method: "POST",
      body: JSON.stringify({
        paymentMethod: "IBFT",
        paymentReceipt: "receipts/ibft-12345.png",
      }),
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.booking.status).toBe("PENDING_PAYMENT");
    expect(body.booking.paymentReceipt).toBe("receipts/ibft-12345.png");
  });

  test("returns 403 if non-renter tries to pay", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "PENDING_PAYMENT",
      renterId: "renter-uuid",
    } as any);

    const req = new Request(`http://localhost/api/bookings/${bookingId}/pay`, {
      method: "POST",
      body: JSON.stringify({ paymentMethod: "STRIPE" }),
      headers: {
        ...getAuthHeader("attacker-uuid"), // Attacker is not the renter
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(403);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });

  test("returns 400 if booking is not in PENDING_PAYMENT status", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: bookingId,
      status: "PENDING_APPROVAL", // Has not been approved by owner yet
      renterId: "renter-uuid",
    } as any);

    const req = new Request(`http://localhost/api/bookings/${bookingId}/pay`, {
      method: "POST",
      body: JSON.stringify({ paymentMethod: "STRIPE" }),
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req, { params: { id: bookingId } });
    expect(response.status).toBe(400);
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });
});
