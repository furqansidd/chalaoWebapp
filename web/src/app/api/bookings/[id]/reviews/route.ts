import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getAuthenticatedUser } from "../../../../../lib/auth";

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
      include: { car: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    // Service-layer relationship verification
    const isRenter = booking.renterId === user.userId;
    const isOwner = booking.car.ownerId === user.userId;

    if (!isRenter && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden. Only the renter or owner of the booking can leave a review." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (rating === undefined || typeof rating !== "number") {
      return NextResponse.json(
        { error: "Missing required field: rating must be a valid number." },
        { status: 400 }
      );
    }

    // Validate rating limits
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: "Invalid rating. Must be an integer between 1 and 5 stars." },
        { status: 400 }
      );
    }

    // Determine reviewee identity
    const revieweeId = isRenter ? booking.car.ownerId : booking.renterId;

    // Check for duplicate reviews
    const existingReview = await prisma.review.findFirst({
      where: {
        bookingId,
        reviewerId: user.userId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Conflict. You have already submitted a review for this booking." },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId: user.userId,
        revieweeId,
        rating,
        comment: comment || null,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    console.error("Booking review creation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during review creation." },
      { status: 500 }
    );
  }
}
