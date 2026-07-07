import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getAuthenticatedUser } from "../../../../../lib/auth";
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
        { error: "Forbidden. Only the renter who booked this trip can execute check-in." },
        { status: 403 }
      );
    }

    // State machine check
    if (booking.status !== BookingStatus.PAID) {
      return NextResponse.json(
        { error: `Check-in cannot be executed for a booking with status ${booking.status}. Expected PAID.` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { preTripPhotos } = body;

    if (!preTripPhotos) {
      return NextResponse.json(
        { error: "Missing required parameter: preTripPhotos is mandatory." },
        { status: 400 }
      );
    }

    // Check all 6 angles
    const requiredAngles = ["front", "back", "left", "right", "interior", "odometer"];
    for (const angle of requiredAngles) {
      if (!preTripPhotos[angle]) {
        return NextResponse.json(
          { error: `Missing pre-trip inspection photo for angle: ${angle}. All 6 angles are required.` },
          { status: 400 }
        );
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        preTripPhotos,
        status: BookingStatus.CHECKED_IN,
      },
    });

    return NextResponse.json({ booking: updatedBooking }, { status: 200 });
  } catch (error: any) {
    console.error("Booking check-in error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during check-in." },
      { status: 500 }
    );
  }
}
