import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getAuthenticatedUser } from "../../../../../lib/auth";
import { triggerDamageAnalysis } from "../../../../../lib/damageWorker";
import { BookingStatus } from "@prisma/client";

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
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    // Service-layer renter check
    if (booking.renterId !== user.userId) {
      return NextResponse.json(
        { error: "Forbidden. Only the renter who booked this trip can execute check-out." },
        { status: 403 }
      );
    }

    // State machine check
    if (booking.status !== BookingStatus.CHECKED_IN) {
      return NextResponse.json(
        { error: `Check-out cannot be executed for a booking with status ${booking.status}. Expected CHECKED_IN.` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { postTripPhotos } = body;

    if (!postTripPhotos) {
      return NextResponse.json(
        { error: "Missing required parameter: postTripPhotos is mandatory." },
        { status: 400 }
      );
    }

    // Check all 6 angles
    const requiredAngles = ["front", "back", "left", "right", "interior", "odometer"];
    for (const angle of requiredAngles) {
      if (!postTripPhotos[angle]) {
        return NextResponse.json(
          { error: `Missing post-trip inspection photo for angle: ${angle}. All 6 angles are required.` },
          { status: 400 }
        );
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        postTripPhotos,
        status: BookingStatus.CHECKED_OUT,
      },
    });

    // Trigger async damage analysis job (non-blocking)
    triggerDamageAnalysis(bookingId).catch((err) => {
      console.error(`[Background Task] Failed to invoke damage analysis for booking ${bookingId}:`, err);
    });

    return NextResponse.json({ booking: updatedBooking }, { status: 200 });
  } catch (error: any) {
    console.error("Booking check-out error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during check-out." },
      { status: 500 }
    );
  }
}
