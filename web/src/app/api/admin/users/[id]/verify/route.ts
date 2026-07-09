import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getAuthenticatedUser } from "../../../../../../lib/auth";

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

    const targetUserId = params.id;

    // Fetch user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Update verification status
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isVerified: true },
    });

    // Exclude passwordHash in return object
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({ user: userWithoutPassword }, { status: 200 });
  } catch (error: any) {
    console.error("Admin user verification error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during user verification." },
      { status: 500 }
    );
  }
}
