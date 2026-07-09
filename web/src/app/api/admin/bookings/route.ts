import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getAuthenticatedUser } from "../../../../lib/auth";
import { BookingStatus, PaymentMethod } from "@prisma/client";

export async function GET(request: Request) {
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

    const bookings = await prisma.booking.findMany({
      where: {
        paymentMethod: PaymentMethod.IBFT,
        status: BookingStatus.PENDING_PAYMENT,
      },
      include: {
        renter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        car: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error: any) {
    console.error("Admin bookings retrieval error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during bookings retrieval." },
      { status: 500 }
    );
  }
}
