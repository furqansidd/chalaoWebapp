import { expect, test, describe, vi, beforeEach } from "vitest";
import { POST, GET } from "./route";
import { prisma } from "../../../lib/prisma";
import { signJwt } from "../../../lib/auth";

vi.mock("../../../lib/prisma", () => {
  return {
    prisma: {
      car: {
        findUnique: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
      },
      booking: {
        findMany: vi.fn(),
      },
    },
  };
});

describe("POST /api/cars", () => {
  const jwtSecret = "test-jwt-secret-key-32-characters";
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = jwtSecret;
  });

  const getAuthHeader = (userId: string) => {
    const token = signJwt(
      { userId, email: "owner@example.com", role: "USER" },
      jwtSecret
    );
    return { Authorization: `Bearer ${token}` };
  };

  test("creates a car listing successfully", async () => {
    vi.mocked(prisma.car.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.car.create).mockImplementation(async (args: any) => {
      return { id: "car-uuid", ...args.data };
    });

    const requestBody = {
      make: "Honda",
      model: "Civic",
      year: 2022,
      plateNumber: "LEB-1234",
      city: "LAHORE",
      basePrice: 5000,
      images: ["image1.jpg"],
    };

    const req = new Request("http://localhost/api/cars", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        ...getAuthHeader("owner-uuid"),
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.car.id).toBe("car-uuid");
    expect(body.car.ownerId).toBe("owner-uuid");
    expect(prisma.car.create).toHaveBeenCalledTimes(1);
  });

  test("rejects spoofed x-user-id header and uses verified user session ID", async () => {
    vi.mocked(prisma.car.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.car.create).mockImplementation(async (args: any) => {
      return { id: "car-uuid", ...args.data };
    });

    const requestBody = {
      make: "Honda",
      model: "Civic",
      year: 2022,
      plateNumber: "LEB-1234",
      city: "LAHORE",
      basePrice: 5000,
    };

    const req = new Request("http://localhost/api/cars", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        ...getAuthHeader("real-owner-uuid"),
        "x-user-id": "spoofed-attacker-uuid", // Attacker tries to spoof x-user-id header
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    const body = await response.json();
    // The created car ownerId must be real-owner-uuid, ignoring spoofed-attacker-uuid completely
    expect(body.car.ownerId).toBe("real-owner-uuid");
    expect(body.car.ownerId).not.toBe("spoofed-attacker-uuid");
  });

  test("returns 401 if Authorization token is missing", async () => {
    const requestBody = {
      make: "Honda",
      model: "Civic",
      year: 2022,
      plateNumber: "LEB-1234",
      city: "LAHORE",
      basePrice: 5000,
    };

    const req = new Request("http://localhost/api/cars", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    expect(prisma.car.create).not.toHaveBeenCalled();
  });

  test("returns 400 for duplicate plate number", async () => {
    vi.mocked(prisma.car.findUnique).mockResolvedValue({
      id: "existing-car-uuid",
      plateNumber: "LEB-1234",
    } as any);

    const requestBody = {
      make: "Honda",
      model: "Civic",
      year: 2022,
      plateNumber: "LEB-1234",
      city: "LAHORE",
      basePrice: 5000,
    };

    const req = new Request("http://localhost/api/cars", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        ...getAuthHeader("owner-uuid"),
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain("already exists");
    expect(prisma.car.create).not.toHaveBeenCalled();
  });

  test("returns 400 for invalid city enum value", async () => {
    const requestBody = {
      make: "Honda",
      model: "Civic",
      year: 2022,
      plateNumber: "LEB-1234",
      city: "PESHAWAR", // Not in KARACHI, LAHORE, ISLAMABAD
      basePrice: 5000,
    };

    const req = new Request("http://localhost/api/cars", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        ...getAuthHeader("owner-uuid"),
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain("Invalid city");
  });

  test("returns 400 for negative base price", async () => {
    const requestBody = {
      make: "Honda",
      model: "Civic",
      year: 2022,
      plateNumber: "LEB-1234",
      city: "LAHORE",
      basePrice: -100,
    };

    const req = new Request("http://localhost/api/cars", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        ...getAuthHeader("owner-uuid"),
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});

describe("GET /api/cars", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns all cars when no filters are provided", async () => {
    const mockCars = [
      { id: "1", make: "Toyota", model: "Corolla", city: "KARACHI" },
      { id: "2", make: "Honda", model: "Civic", city: "LAHORE" },
    ];
    vi.mocked(prisma.car.findMany).mockResolvedValue(mockCars as any);

    const req = new Request("http://localhost/api/cars");
    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.cars).toHaveLength(2);
    expect(prisma.car.findMany).toHaveBeenCalledWith({
      where: {},
    });
  });

  test("filters cars by city successfully", async () => {
    const mockCars = [
      { id: "2", make: "Honda", model: "Civic", city: "LAHORE" },
    ];
    vi.mocked(prisma.car.findMany).mockResolvedValue(mockCars as any);

    const req = new Request("http://localhost/api/cars?city=LAHORE");
    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.cars).toHaveLength(1);
    expect(prisma.car.findMany).toHaveBeenCalledWith({
      where: {
        city: "LAHORE",
      },
    });
  });

  test("returns 400 for invalid city query parameter", async () => {
    const req = new Request("http://localhost/api/cars?city=INVALID_CITY");
    const response = await GET(req);
    expect(response.status).toBe(400);
    expect(prisma.car.findMany).not.toHaveBeenCalled();
  });

  test("excludes cars with overlapping bookings", async () => {
    // Mock 2 bookings overlapping for car ID "1"
    vi.mocked(prisma.booking.findMany).mockResolvedValue([
      { carId: "1" },
    ] as any);

    // Mock findMany to return only car ID "2" which has no overlapping booking
    vi.mocked(prisma.car.findMany).mockResolvedValue([
      { id: "2", make: "Honda", model: "Civic", city: "LAHORE" },
    ] as any);

    const req = new Request(
      "http://localhost/api/cars?city=LAHORE&startDate=2026-07-10T12:00:00.000Z&endDate=2026-07-15T12:00:00.000Z"
    );
    const response = await GET(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.cars).toHaveLength(1);
    expect(body.cars[0].id).toBe("2");

    // Check that bookings were queried with correct overlap logic
    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: {
        status: { not: "CANCELLED" },
        OR: [
          {
            startDate: { lte: new Date("2026-07-15T12:00:00.000Z") },
            endDate: { gte: new Date("2026-07-10T12:00:00.000Z") },
          },
        ],
      },
      select: { carId: true },
    });

    // Check that cars findMany excluded carId "1"
    expect(prisma.car.findMany).toHaveBeenCalledWith({
      where: {
        city: "LAHORE",
        id: { notIn: ["1"] },
      },
    });
  });

  test("returns 400 if only one date parameter is provided", async () => {
    const req = new Request("http://localhost/api/cars?startDate=2026-07-10T12:00:00.000Z");
    const response = await GET(req);
    expect(response.status).toBe(400);
  });

  test("returns 400 if startDate is after endDate", async () => {
    const req = new Request(
      "http://localhost/api/cars?startDate=2026-07-15T12:00:00.000Z&endDate=2026-07-10T12:00:00.000Z"
    );
    const response = await GET(req);
    expect(response.status).toBe(400);
  });
});
