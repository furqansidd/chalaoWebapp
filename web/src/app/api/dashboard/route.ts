import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getAuthenticatedUser } from "../../../lib/auth";
import { BookingStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Valid session token is required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    if (!role || (role !== "renter" && role !== "owner")) {
      return NextResponse.json(
        { error: "Missing or invalid query parameter: role must be either 'renter' or 'owner'." },
        { status: 400 }
      );
    }

    const userId = user.userId;

    if (role === "renter") {
      // Fetch bookings where user is the renter
      const bookings = await prisma.booking.findMany({
        where: { renterId: userId },
        include: {
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

      // Calculate renter statistics
      const bookingsCount = bookings.length;
      const totalSpent = bookings.reduce((sum, b) => {
        if (
          [
            BookingStatus.PAID,
            BookingStatus.CHECKED_IN,
            BookingStatus.ACTIVE,
            BookingStatus.CHECKED_OUT,
            BookingStatus.COMPLETED,
          ].includes(b.status)
        ) {
          return sum + b.totalPrice;
        }
        return sum;
      }, 0);

      const activeBookingsCount = bookings.filter((b) =>
        [
          BookingStatus.PAID,
          BookingStatus.CHECKED_IN,
          BookingStatus.ACTIVE,
          BookingStatus.CHECKED_OUT,
        ].includes(b.status)
      ).length;

      return NextResponse.json(
        {
          stats: {
            bookingsCount,
            totalSpent,
            activeBookingsCount,
          },
          bookings,
        },
        { status: 200 }
      );
    } else {
      // Fetch bookings for owner's cars
      const bookings = await prisma.booking.findMany({
        where: {
          car: {
            ownerId: userId,
          },
        },
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
        orderBy: { createdAt: "desc" },
      });

      // Fetch owner's cars
      const cars = await prisma.car.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: "desc" },
      });

      // Calculate owner statistics
      const carsCount = cars.length;
      const totalEarnings = bookings.reduce((sum, b) => {
        if (
          [
            BookingStatus.PAID,
            BookingStatus.CHECKED_IN,
            BookingStatus.ACTIVE,
            BookingStatus.CHECKED_OUT,
            BookingStatus.COMPLETED,
          ].includes(b.status)
        ) {
          return sum + b.totalPrice;
        }
        return sum;
      }, 0);

      const activeBookingsCount = bookings.filter((b) =>
        [
          BookingStatus.PAID,
          BookingStatus.CHECKED_IN,
          BookingStatus.ACTIVE,
          BookingStatus.CHECKED_OUT,
        ].includes(b.status)
      ).length;

      const pendingApprovalsCount = bookings.filter(
        (b) => b.status === BookingStatus.PENDING_APPROVAL
      ).length;

      return NextResponse.json(
        {
          stats: {
            carsCount,
            totalEarnings,
            activeBookingsCount,
            pendingApprovalsCount,
          },
          bookings,
          cars,
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during dashboard retrieval." },
      { status: 500 }
    );
  }
}
