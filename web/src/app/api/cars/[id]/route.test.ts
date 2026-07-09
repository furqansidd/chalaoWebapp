import { expect, test, describe, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { prisma } from "../../../../lib/prisma";

vi.mock("../../../../lib/prisma", () => {
  return {
    prisma: {
      car: {
        findUnique: vi.fn(),
      },
    },
  };
});

describe("GET /api/cars/:id", () => {
  const carId = "car-uuid";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 404 if the car listing does not exist", async () => {
    vi.mocked(prisma.car.findUnique).mockResolvedValue(null);

    const req = new Request(`http://localhost/api/cars/${carId}`, {
      method: "GET",
    });

    const response = await GET(req, { params: { id: carId } });
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error).toContain("not found");
  });

  test("returns 200 with car details if found", async () => {
    const mockCar = {
      id: carId,
      make: "Toyota",
      model: "Camry",
      year: 2021,
      plateNumber: "LEB-1111",
      city: "LAHORE",
      basePrice: 6000,
      ownerId: "owner-uuid",
    };

    vi.mocked(prisma.car.findUnique).mockResolvedValue(mockCar as any);

    const req = new Request(`http://localhost/api/cars/${carId}`, {
      method: "GET",
    });

    const response = await GET(req, { params: { id: carId } });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.car.id).toBe(carId);
    expect(body.car.make).toBe("Toyota");
    expect(prisma.car.findUnique).toHaveBeenCalledWith({
      where: { id: carId },
    });
  });
});
