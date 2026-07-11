const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function run() {
  const booking = await prisma.booking.findFirst({
    orderBy: { updatedAt: 'desc' }
  });

  if (booking) {
    console.log('Triggering damage report for booking:', booking.id);
    
    // We can just manually insert the mock damage report directly in the database here
    await prisma.damageReport.upsert({
      where: { bookingId: booking.id },
      update: {
        similarityScore: 0.85,
        flaggedRegions: [
          { "box": [100, 150, 200, 250], "label": "scratch", "confidence": 0.92 }
        ],
        resultImage: "https://via.placeholder.com/600x400?text=Mock+Heatmap",
      },
      create: {
        bookingId: booking.id,
        similarityScore: 0.85,
        flaggedRegions: [
          { "box": [100, 150, 200, 250], "label": "scratch", "confidence": 0.92 }
        ],
        resultImage: "https://via.placeholder.com/600x400?text=Mock+Heatmap",
      },
    });
    
    console.log('Done generating damage report!');
  } else {
    console.log('No booking found in DB.');
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
