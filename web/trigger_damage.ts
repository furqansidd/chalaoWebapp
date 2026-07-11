import { PrismaClient } from "@prisma/client";
import { triggerDamageAnalysis } from "./src/lib/damageWorker.ts";

const prisma = new PrismaClient();

async function run() {
  const booking = await prisma.booking.findFirst({
    orderBy: { updatedAt: 'desc' }
  });

  if (booking) {
    console.log('Triggering damage report for booking:', booking.id);
    await triggerDamageAnalysis(booking.id);
    console.log('Done generating damage report!');
  } else {
    console.log('No booking found in DB.');
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
