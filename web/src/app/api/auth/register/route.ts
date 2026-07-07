import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcrypt";
import { encrypt } from "../../../../lib/encryption";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, cnicNumber, drivingLicense } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, name are mandatory." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists." },
        { status: 400 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Encrypt sensitive PII
    const encryptedCnic = cnicNumber ? encrypt(cnicNumber) : null;
    const encryptedLicense = drivingLicense ? encrypt(drivingLicense) : null;

    // Create User record
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        cnicNumber: encryptedCnic,
        drivingLicense: encryptedLicense,
      },
    });

    // Return created user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during registration." },
      { status: 500 }
    );
  }
}
