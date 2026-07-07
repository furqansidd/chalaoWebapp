import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { City } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const ownerId = request.headers.get("x-user-id");
    if (!ownerId) {
      return NextResponse.json(
        { error: "Unauthorized. x-user-id header is required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { make, model, year, plateNumber, city, basePrice, images } = body;

    // Field Validation
    if (!make || !model || !year || !plateNumber || !city || basePrice === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: make, model, year, plateNumber, city, basePrice are mandatory." },
        { status: 400 }
      );
    }

    // Enum validation
    if (!Object.values(City).includes(city as City)) {
      return NextResponse.json(
        { error: `Invalid city. Allowed values are: ${Object.values(City).join(", ")}` },
        { status: 400 }
      );
    }

    // Price validation
    if (basePrice < 0) {
      return NextResponse.json(
        { error: "Base price cannot be negative." },
        { status: 400 }
      );
    }

    // Plate number uniqueness check
    const existingCar = await prisma.car.findUnique({
      where: { plateNumber },
    });

    if (existingCar) {
      return NextResponse.json(
        { error: `Car with plate number ${plateNumber} already exists.` },
        { status: 400 }
      );
    }

    // Create listing
    const car = await prisma.car.create({
      data: {
        ownerId,
        make,
        model,
        year: Number(year),
        plateNumber,
        city: city as City,
        basePrice: Number(basePrice),
        images: images || [],
      },
    });

    return NextResponse.json({ car }, { status: 201 });
  } catch (error: any) {
    console.error("Listing creation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during car creation." },
      { status: 500 }
    );
  }
}

// Basic placeholder GET implementation, will be refined in Task 2
export async function GET(request: Request) {
  return NextResponse.json({ cars: [] });
}
