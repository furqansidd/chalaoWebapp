import { PrismaClient, Role, City, RiskTier } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create users
  const userA = await prisma.user.upsert({
    where: { email: "owner@chalao.com" },
    update: {},
    create: {
      email: "owner@chalao.com",
      passwordHash: "dummyhash",
      name: "Ali (Owner)",
      role: Role.USER,
      isVerified: true,
    },
  });

  const userB = await prisma.user.upsert({
    where: { email: "renter@chalao.com" },
    update: {},
    create: {
      email: "renter@chalao.com",
      passwordHash: "dummyhash",
      name: "Ahmed (Renter)",
      role: Role.USER,
      isVerified: true,
    },
  });

  // Create a car for Owner
  const car1 = await prisma.car.upsert({
    where: { plateNumber: "ABC-123" },
    update: {},
    create: {
      ownerId: userA.id,
      make: "Toyota",
      model: "Corolla",
      year: 2022,
      plateNumber: "ABC-123",
      city: City.LAHORE,
      basePrice: 8000,
      images: [
        "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1623810014605-df3e00780f2d?auto=format&fit=crop&w=800&q=80"
      ],
    },
  });

  const car2 = await prisma.car.upsert({
    where: { plateNumber: "XYZ-999" },
    update: {},
    create: {
      ownerId: userA.id,
      make: "Honda",
      model: "Civic",
      year: 2023,
      plateNumber: "XYZ-999",
      city: City.KARACHI,
      basePrice: 12000,
      images: [
        "https://images.unsplash.com/photo-1605891398935-77987cc26e38?auto=format&fit=crop&w=800&q=80",
      ],
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
