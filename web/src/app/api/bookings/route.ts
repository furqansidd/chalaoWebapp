import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { PaymentMethod, BookingStatus } from "@prisma/client";
import { getAuthenticatedUser } from "../../../lib/auth";

// Simple 32-bit FNV-1a or standard hash function to convert string to signed 32-bit integer
function hashStringToInt32(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to signed 32-bit integer
  }
  return hash;
}

export async function POST(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Valid session token is required." },
        { status: 401 }
      );
    }
    const renterId = user.userId;

    const body = await request.json();
    const { carId, startDate, endDate, totalPrice, securityDeposit, paymentMethod } = body;

    // Field validation
    if (!carId || !startDate || !endDate || totalPrice === undefined || securityDeposit === undefined || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields: carId, startDate, endDate, totalPrice, securityDeposit, paymentMethod are mandatory." },
        { status: 400 }
      );
    }

    // Validate payment method enum
    if (!Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
      return NextResponse.json(
        { error: `Invalid paymentMethod. Allowed values are: ${Object.values(PaymentMethod).join(", ")}` },
        { status: 400 }
      );
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

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

    // Check if car exists
    const car = await prisma.car.findUnique({
      where: { id: carId },
    });

    if (!car) {
      return NextResponse.json(
        { error: "Car listing not found." },
        { status: 400 }
      );
    }

    // Prevent owners from renting their own vehicles (Business validation check)
    if (car.ownerId === renterId) {
      return NextResponse.json(
        { error: "You cannot rent your own vehicle." },
        { status: 400 }
      );
    }

    // Parse renter age and license years (provide defaults for compatibility)
    const renterAge = body.renterAge !== undefined ? Number(body.renterAge) : 25;
    const licenseYears = body.licenseYears !== undefined ? Number(body.licenseYears) : 5;

    // Retrieve renter profile details
    const renterUser = await prisma.user.findUnique({
      where: { id: renterId },
    });
    const isVerified = renterUser ? renterUser.isVerified : false;

    // Query renter past dispute counts (computable metrics)
    const disputeCount = await prisma.dispute.count({
      where: { raisedById: renterId },
    });
    const hasPastDisputes = disputeCount > 0;

    // ML dynamic pricing & risk assessment fetch
    let riskScore = 0.2;
    let riskTier = "LOW";
    let dynamicDailyRate = car.basePrice;
    let suggestedDeposit = car.basePrice;

    try {
      const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
      const mlResponse = await fetch(`${mlServiceUrl}/api/v1/pricing-and-risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renter_age: renterAge,
          license_years: licenseYears,
          has_disputes: hasPastDisputes,
          is_verified: isVerified,
          base_price: car.basePrice,
          city: car.city,
        }),
      });

      if (mlResponse.ok) {
        const mlData = await mlResponse.json();
        riskScore = mlData.riskScore;
        riskTier = mlData.riskTier;
        dynamicDailyRate = mlData.dynamicDailyRate;
        suggestedDeposit = mlData.suggestedDeposit;
      } else {
        throw new Error("FastAPI pricing & risk error status");
      }
    } catch (err) {
      console.warn("ML Service offline, falling back to local heuristic:", err);
      // Local fallback pricing & risk logic
      riskScore = 0.2;
      if (licenseYears < 2) riskScore += 0.5;
      if (hasPastDisputes) riskScore += 0.3;
      if (isVerified) riskScore -= 0.15;
      riskScore = Math.min(Math.max(riskScore, 0.0), 1.0);

      if (riskScore >= 0.65) riskTier = "HIGH";
      else if (riskScore >= 0.35) riskTier = "MEDIUM";

      const cityMultipliers: Record<string, number> = { KARACHI: 1.10, LAHORE: 1.05, ISLAMABAD: 1.00 };
      const cityMult = cityMultipliers[car.city] ?? 1.00;
      const riskMult = riskTier === "HIGH" ? 1.20 : (riskTier === "MEDIUM" ? 1.08 : 1.00);

      dynamicDailyRate = car.basePrice * cityMult * riskMult;
      suggestedDeposit = car.basePrice * (riskTier === "HIGH" ? 2.0 : (riskTier === "MEDIUM" ? 1.5 : 1.0));
    }

    // Compute rental duration in days
    const diffTime = Math.abs(parsedEndDate.getTime() - parsedStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const computedTotalPrice = dynamicDailyRate * diffDays;

    // Hash values for 2-argument pg_advisory_xact_lock
    const classId = hashStringToInt32("booking");
    const objId = hashStringToInt32(carId);

    const booking = await prisma.$transaction(async (tx) => {
      // 1. Acquire transaction-level advisory lock
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${classId}, ${objId})`;

      // 2. Perform safe, race-free overlap check
      const overlapping = await tx.booking.findMany({
        where: {
          carId: carId,
          status: {
            in: [
              BookingStatus.PENDING_PAYMENT,
              BookingStatus.PAID,
              BookingStatus.CHECKED_IN,
              BookingStatus.ACTIVE,
              BookingStatus.CHECKED_OUT,
              BookingStatus.COMPLETED,
            ],
          },
          OR: [
            {
              startDate: { lte: parsedEndDate },
              endDate: { gte: parsedStartDate },
            },
          ],
        },
      });

      if (overlapping.length > 0) {
        throw new Error("OVERLAP_ERROR");
      }

      // 3. Create booking and risk assessment snapshot safely
      return await tx.booking.create({
        data: {
          carId,
          renterId,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          totalPrice: Number(computedTotalPrice),
          securityDeposit: Number(suggestedDeposit),
          paymentMethod: paymentMethod as PaymentMethod,
          status: BookingStatus.PENDING_APPROVAL,
          riskAssessment: {
            create: {
              renterAge,
              licenseYears,
              hasPastDisputes,
              isVerified,
              score: riskScore,
              tier: riskTier as any,
            }
          }
        },
      });
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: any) {
    if (error.message === "OVERLAP_ERROR") {
      return NextResponse.json(
        { error: "This vehicle is already booked for the selected dates." },
        { status: 400 }
      );
    }
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during booking creation." },
      { status: 500 }
    );
  }
}

// GET lists all bookings for the authenticated user (either as renter or owner)
export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Valid session token is required." },
        { status: 401 }
      );
    }

    // Fetch bookings where user is the renter
    const bookings = await prisma.booking.findMany({
      where: { renterId: user.userId },
      include: { car: true },
    });

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error: any) {
    console.error("Booking list retrieval error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during booking retrieval." },
      { status: 500 }
    );
  }
}
