import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const car = await prisma.car.findUnique({
      where: { id },
    });

    if (!car) {
      return NextResponse.json(
        { error: "Car listing not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ car }, { status: 200 });
  } catch (error: any) {
    console.error("Car retrieval error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during car retrieval." },
      { status: 500 }
    );
  }
}
