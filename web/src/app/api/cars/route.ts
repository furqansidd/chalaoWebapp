import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { City } from "@prisma/client";
import { getAuthenticatedUser } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Valid session token is required." },
        { status: 401 }
      );
    }
    const ownerId = user.userId;

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const where: any = {};

    // Validate City if provided
    if (city) {
      if (!Object.values(City).includes(city as City)) {
        return NextResponse.json(
          { error: `Invalid city. Allowed values are: ${Object.values(City).join(", ")}` },
          { status: 400 }
        );
      }
      where.city = city as City;
    }

    // Validate Dates if provided
    if (startDateParam || endDateParam) {
      if (!startDateParam || !endDateParam) {
        return NextResponse.json(
          { error: "Both startDate and endDate must be provided to filter by availability." },
          { status: 400 }
        );
      }

      const parsedStartDate = new Date(startDateParam);
      const parsedEndDate = new Date(endDateParam);

      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format. Expected ISO-8601 strings." },
          { status: 400 }
        );
      }

      if (parsedStartDate > parsedEndDate) {
        return NextResponse.json(
          { error: "startDate cannot be after endDate." },
          { status: 400 }
        );
      }

      // Find cars with overlapping bookings that are not cancelled
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          status: { not: "CANCELLED" },
          OR: [
            {
              startDate: { lte: parsedEndDate },
              endDate: { gte: parsedStartDate },
            },
          ],
        },
        select: { carId: true },
      });

      const bookedCarIds = overlappingBookings.map((b) => b.carId);
      if (bookedCarIds.length > 0) {
        where.id = { notIn: bookedCarIds };
      }
    }

    const cars = await prisma.car.findMany({ where });

    return NextResponse.json({ cars }, { status: 200 });
  } catch (error: any) {
    console.error("Listing retrieval error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during car retrieval." },
      { status: 500 }
    );
  }
}
