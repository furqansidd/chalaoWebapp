import { expect, test, describe, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { prisma } from "../../../lib/prisma";
import { signJwt } from "../../../lib/auth";

vi.mock("../../../lib/prisma", () => {
  return {
    prisma: {
      car: {
        findUnique: vi.fn(),
      },
      booking: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

describe("POST /api/bookings", () => {
  const jwtSecret = "test-jwt-secret-key-32-characters";

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

  test("creates a booking request successfully", async () => {
    vi.mocked(prisma.car.findUnique).mockResolvedValue({
      id: "car-uuid",
      ownerId: "owner-uuid",
      basePrice: 5000,
    } as any);

    // Mock prisma.$transaction to return the created booking directly for this unit test
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        $executeRaw: vi.fn(),
        booking: {
          findMany: vi.fn().mockResolvedValue([]), // No overlaps
          create: vi.fn().mockImplementation(async (args: any) => {
            return { id: "booking-uuid", ...args.data };
          }),
        },
      };
      return await callback(mockTx);
    });

    const requestBody = {
      carId: "car-uuid",
      startDate: "2026-08-10T12:00:00.000Z",
      endDate: "2026-08-15T12:00:00.000Z",
      totalPrice: 25000,
      securityDeposit: 5000,
      paymentMethod: "STRIPE",
    };

    const req = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.booking.id).toBe("booking-uuid");
    expect(body.booking.renterId).toBe("renter-uuid");
    expect(body.booking.status).toBe("PENDING_APPROVAL");
  });

  test("returns 401 if unauthorized", async () => {
    const requestBody = {
      carId: "car-uuid",
      startDate: "2026-08-10T12:00:00.000Z",
      endDate: "2026-08-15T12:00:00.000Z",
      totalPrice: 25000,
      securityDeposit: 5000,
      paymentMethod: "STRIPE",
    };

    const req = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  test("returns 400 for missing input parameters", async () => {
    const requestBody = {
      carId: "car-uuid",
    };

    const req = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  test("returns 400 if there is an overlapping booking", async () => {
    vi.mocked(prisma.car.findUnique).mockResolvedValue({
      id: "car-uuid",
      ownerId: "owner-uuid",
      basePrice: 5000,
    } as any);

    // Mock transaction throwing overlap error
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        $executeRaw: vi.fn(),
        booking: {
          findMany: vi.fn().mockResolvedValue([{ id: "existing-booking" }]), // Overlap found!
        },
      };
      return await callback(mockTx);
    });

    const requestBody = {
      carId: "car-uuid",
      startDate: "2026-08-10T12:00:00.000Z",
      endDate: "2026-08-15T12:00:00.000Z",
      totalPrice: 25000,
      securityDeposit: 5000,
      paymentMethod: "STRIPE",
    };

    const req = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        ...getAuthHeader("renter-uuid"),
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain("already booked");
  });

  test("returns 400 if owner tries to rent their own vehicle", async () => {
    vi.mocked(prisma.car.findUnique).mockResolvedValue({
      id: "car-uuid",
      ownerId: "owner-uuid", // Owner ID matches renter ID
    } as any);

    const requestBody = {
      carId: "car-uuid",
      startDate: "2026-08-10T12:00:00.000Z",
      endDate: "2026-08-15T12:00:00.000Z",
      totalPrice: 25000,
      securityDeposit: 5000,
      paymentMethod: "STRIPE",
    };

    const req = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        ...getAuthHeader("owner-uuid"), // Renter ID is same as owner-uuid
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain("cannot rent your own vehicle");
  });
});
