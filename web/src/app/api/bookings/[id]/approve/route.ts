import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getAuthenticatedUser } from "../../../../../lib/auth";
import { BookingStatus } from "@prisma/client";

export async function PATCH(
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

    // Fetch booking details including the car details to check ownerId
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { car: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking request not found." },
        { status: 404 }
      );
    }

    // Service-layer ownership verification
    if (booking.car.ownerId !== user.userId) {
      return NextResponse.json(
        { error: "Forbidden. Only the owner of the vehicle can approve or reject this booking." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { approved, reason } = body;

    if (approved === undefined) {
      return NextResponse.json(
        { error: "Missing required parameter: approved (boolean) is mandatory." },
        { status: 400 }
      );
    }

    let updatedBooking;

    if (approved) {
      // Transition to PENDING_PAYMENT
      updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.PENDING_PAYMENT,
        },
      });
    } else {
      // Transition to CANCELLED
      updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancellationReason: reason || "Rejected by vehicle owner.",
        },
      });
    }

    return NextResponse.json({ booking: updatedBooking }, { status: 200 });
  } catch (error: any) {
    console.error("Booking approval error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during booking approval." },
      { status: 500 }
    );
  }
}
