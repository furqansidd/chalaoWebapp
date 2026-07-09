import { expect, test, describe, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { prisma } from "../../../lib/prisma";
import { signJwt } from "../../../lib/auth";

vi.mock("../../../lib/prisma", () => {
  return {
    prisma: {
      booking: {
        findMany: vi.fn(),
      },
      car: {
        findMany: vi.fn(),
      },
    },
  };
});

describe("GET /api/dashboard", () => {
  const jwtSecret = "test-jwt-secret-key-32-characters";
  const userId = "user-uuid";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = jwtSecret;
  });

  const getAuthHeader = (id: string, role: string = "USER") => {
    const token = signJwt(
      { userId: id, email: "user@example.com", role },
      jwtSecret
    );
    return { Authorization: `Bearer ${token}` };
  };

  test("returns 401 if unauthorized (no token)", async () => {
    const req = new Request("http://localhost/api/dashboard?role=renter", {
      method: "GET",
    });

    const response = await GET(req);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain("Unauthorized");
  });

  test("returns 400 if role parameter is missing", async () => {
    const req = new Request("http://localhost/api/dashboard", {
      method: "GET",
      headers: {
        ...getAuthHeader(userId),
      },
    });

    const response = await GET(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("role");
  });

  test("returns 400 if role parameter is invalid", async () => {
    const req = new Request("http://localhost/api/dashboard?role=invalid_role", {
      method: "GET",
      headers: {
        ...getAuthHeader(userId),
      },
    });

    const response = await GET(req);
    expect(response.status).toBe(400);
  });

  test("returns renter dashboard statistics and list successfully", async () => {
    const mockBookings = [
      {
        id: "booking-1",
        status: "COMPLETED",
        totalPrice: 10000,
        car: {
          id: "car-1",
          make: "Toyota",
          model: "Corolla",
          owner: { id: "owner-1", name: "Owner Name", email: "owner@example.com" },
        },
      },
      {
        id: "booking-2",
        status: "PENDING_APPROVAL",
        totalPrice: 5000,
        car: {
          id: "car-2",
          make: "Honda",
          model: "Civic",
          owner: { id: "owner-2", name: "Owner 2", email: "owner2@example.com" },
        },
      },
      {
        id: "booking-3",
        status: "PAID",
        totalPrice: 15000,
        car: {
          id: "car-1",
          make: "Toyota",
          model: "Corolla",
          owner: { id: "owner-1", name: "Owner Name", email: "owner@example.com" },
        },
      },
    ];

    vi.mocked(prisma.booking.findMany).mockResolvedValue(mockBookings as any);

    const req = new Request("http://localhost/api/dashboard?role=renter", {
      method: "GET",
      headers: {
        ...getAuthHeader(userId),
      },
    });

    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.stats.bookingsCount).toBe(3);
    expect(body.stats.totalSpent).toBe(25000); // 10000 (COMPLETED) + 15000 (PAID)
    expect(body.stats.activeBookingsCount).toBe(1); // PAID is active, COMPLETED is not active, PENDING_APPROVAL is not active
    expect(body.bookings).toHaveLength(3);
    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: { renterId: userId },
      include: {
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

  test("returns owner dashboard statistics and list successfully", async () => {
    const mockBookings = [
      {
        id: "booking-1",
        status: "COMPLETED",
        totalPrice: 20000,
        car: { id: "car-1", make: "Toyota" },
        renter: { id: "renter-1", name: "Renter 1", email: "renter1@example.com" },
      },
      {
        id: "booking-2",
        status: "PENDING_APPROVAL",
        totalPrice: 8000,
        car: { id: "car-1", make: "Toyota" },
        renter: { id: "renter-2", name: "Renter 2", email: "renter2@example.com" },
      },
    ];

    const mockCars = [
      { id: "car-1", make: "Toyota", model: "Corolla", basePrice: 5000 },
    ];

    vi.mocked(prisma.booking.findMany).mockResolvedValue(mockBookings as any);
    vi.mocked(prisma.car.findMany).mockResolvedValue(mockCars as any);

    const req = new Request("http://localhost/api/dashboard?role=owner", {
      method: "GET",
      headers: {
        ...getAuthHeader(userId),
      },
    });

    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.stats.totalEarnings).toBe(20000); // 20000 (COMPLETED)
    expect(body.stats.activeBookingsCount).toBe(0); // None are active (COMPLETED and PENDING_APPROVAL are not active)
    expect(body.stats.pendingApprovalsCount).toBe(1); // PENDING_APPROVAL is 1
    expect(body.stats.carsCount).toBe(1);
    expect(body.bookings).toHaveLength(2);
    expect(body.cars).toHaveLength(1);

    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: { car: { ownerId: userId } },
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
      orderBy: { createdAt: "desc" },
    });

    expect(prisma.car.findMany).toHaveBeenCalledWith({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
    });
  });
});
