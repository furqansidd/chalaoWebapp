import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getAuthenticatedUser } from "../../../../lib/auth";

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

    const disputes = await prisma.dispute.findMany({
      include: {
        raisedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        booking: {
          include: {
            car: true,
            renter: {
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

    return NextResponse.json({ disputes }, { status: 200 });
  } catch (error: any) {
    console.error("Admin disputes list retrieval error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during disputes retrieval." },
      { status: 500 }
    );
  }
}
