import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getAuthenticatedUser } from "../../../../../lib/auth";
import { DisputeStatus } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Valid session token is required." },
        { status: 401 }
      );
    }

    const bookingId = params.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { car: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    // Service-layer ownership verification
    if (booking.renterId !== user.userId && booking.car.ownerId !== user.userId) {
      return NextResponse.json(
        { error: "Forbidden. Only the renter or owner of the booking can raise a dispute." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim() === "") {
      return NextResponse.json(
        { error: "Missing required field: reason (non-empty string) is mandatory." },
        { status: 400 }
      );
    }

    // Check for duplicate disputes
    const existingDispute = await prisma.dispute.findUnique({
      where: { bookingId },
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: "Conflict. A dispute has already been raised for this booking." },
        { status: 400 }
      );
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        raisedById: user.userId,
        reason: reason.trim(),
        status: DisputeStatus.OPEN,
      },
    });

    return NextResponse.json({ dispute }, { status: 201 });
  } catch (error: any) {
    console.error("Booking dispute filing error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during dispute filing." },
      { status: 500 }
    );
  }
}
