import { expect, test, describe, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { prisma } from "../../../lib/prisma";

vi.mock("../../../lib/prisma", () => {
  return {
    prisma: {
      car: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

describe("POST /api/cars", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
        "x-user-id": "owner-uuid",
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.car.id).toBe("car-uuid");
    expect(body.car.ownerId).toBe("owner-uuid");
    expect(prisma.car.create).toHaveBeenCalledTimes(1);
  });

  test("returns 401 if x-user-id header is missing", async () => {
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
        "x-user-id": "owner-uuid",
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
        "x-user-id": "owner-uuid",
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
        "x-user-id": "owner-uuid",
      },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
