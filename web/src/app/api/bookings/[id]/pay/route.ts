import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getAuthenticatedUser } from "../../../../../lib/auth";
import { BookingStatus, PaymentMethod } from "@prisma/client";

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

    // Service-layer renter verification
    if (booking.renterId !== user.userId) {
      return NextResponse.json(
        { error: "Forbidden. Only the renter who requested this booking can process payment." },
        { status: 403 }
      );
    }

    // Enforce state machine restriction
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      return NextResponse.json(
        { error: `Payment cannot be processed for a booking with status ${booking.status}. Expected PENDING_PAYMENT.` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { paymentMethod, paymentReceipt } = body;

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Missing required parameter: paymentMethod is mandatory." },
        { status: 400 }
      );
    }

    if (!Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
      return NextResponse.json(
        { error: `Invalid paymentMethod. Allowed values are: ${Object.values(PaymentMethod).join(", ")}` },
        { status: 400 }
      );
    }

    let updatedBooking;

    if (paymentMethod === PaymentMethod.STRIPE) {
      // Stripe payment completes immediately (mock Stripe integration)
      updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentMethod: PaymentMethod.STRIPE,
          status: BookingStatus.PAID,
        },
      });
    } else {
      // IBFT requires manual upload and remains in PENDING_PAYMENT status
      if (!paymentReceipt) {
        return NextResponse.json(
          { error: "Missing required parameter: paymentReceipt is required when choosing IBFT bank transfer." },
          { status: 400 }
        );
      }

      updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentMethod: PaymentMethod.IBFT,
          paymentReceipt,
          status: BookingStatus.PENDING_PAYMENT,
        },
      });
    }

    return NextResponse.json({ booking: updatedBooking }, { status: 200 });
  } catch (error: any) {
    console.error("Booking payment processing error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during booking payment." },
      { status: 500 }
    );
  }
}
