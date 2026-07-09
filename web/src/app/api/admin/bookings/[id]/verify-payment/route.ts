import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getAuthenticatedUser } from "../../../../../../lib/auth";
import { BookingStatus, PaymentMethod } from "@prisma/client";

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

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Admin role is required to access this endpoint." },
        { status: 403 }
      );
    }

    const bookingId = params.id;

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    // Verify booking state and payment method
    if (
      booking.status !== BookingStatus.PENDING_PAYMENT ||
      booking.paymentMethod !== PaymentMethod.IBFT
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid booking state. Only bookings in PENDING_PAYMENT status and utilizing IBFT payment method can be verified.",
        },
        { status: 400 }
      );
    }

    // Parse body parameters
    const body = await request.json();
    const { status } = body;

    if (!status || (status !== BookingStatus.PAID && status !== BookingStatus.CANCELLED)) {
      return NextResponse.json(
        { error: "Invalid status. Allowed values are PAID or CANCELLED." },
        { status: 400 }
      );
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    return NextResponse.json({ booking: updatedBooking }, { status: 200 });
  } catch (error: any) {
    console.error("Admin booking payment verification error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during booking verification." },
      { status: 500 }
    );
  }
}
