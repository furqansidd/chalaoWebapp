import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getAuthenticatedUser } from "../../../../../lib/auth";
import { DisputeStatus } from "@prisma/client";

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

    const disputeId = params.id;

    // Fetch dispute
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: "Dispute not found." },
        { status: 404 }
      );
    }

    // Parse status from request body
    const body = await request.json();
    const { status } = body;

    if (!status || (status !== DisputeStatus.RESOLVED && status !== DisputeStatus.DISMISSED)) {
      return NextResponse.json(
        { error: "Invalid status. Allowed values are RESOLVED or DISMISSED." },
        { status: 400 }
      );
    }

    // Update dispute status
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: { status },
    });

    return NextResponse.json({ dispute: updatedDispute }, { status: 200 });
  } catch (error: any) {
    console.error("Admin dispute status update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during dispute resolution." },
      { status: 500 }
    );
  }
}
