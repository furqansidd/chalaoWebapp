import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthenticatedUser } from "../../../../lib/auth";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.userId;
    const userRole = user.role;

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        car: true,
        damageReport: true,
        renter: {
          select: {
            id: true,
            name: true,
            email: true,
            isVerified: true,
          }
        },
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Only allow renter, car owner, or admin to view
    if (booking.renterId !== userId && booking.car.ownerId !== userId && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ booking }, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
