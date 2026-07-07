import { prisma } from "./prisma";

export interface FastAPIResponse {
  bookingId: string;
  similarityScore: number;
  flaggedRegions: any[];
  resultImage: string | null;
}

/**
 * Executes the background damage analysis job.
 * Connects to Python FastAPI ML service, gets structural difference data,
 * and saves the generated DamageReport record to PostgreSQL.
 */
export async function triggerDamageAnalysis(bookingId: string): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      console.error(`[damageWorker] Booking ${bookingId} not found in database.`);
      return;
    }

    if (!booking.preTripPhotos || !booking.postTripPhotos) {
      console.warn(`[damageWorker] Booking ${bookingId} is missing pre-trip or post-trip photos. Skipping analysis.`);
      return;
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
    
    // Call FastAPI service
    const response = await fetch(`${mlServiceUrl}/api/v1/analyze-damage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        booking_id: bookingId,
        pre_photos: booking.preTripPhotos,
        post_photos: booking.postTripPhotos,
      }),
    });

    if (!response.ok) {
      throw new Error(`FastAPI request failed with status: ${response.status}`);
    }

    const result = (await response.json()) as FastAPIResponse;

    // Create or update the DamageReport record
    await prisma.damageReport.upsert({
      where: { bookingId },
      update: {
        similarityScore: result.similarityScore,
        flaggedRegions: result.flaggedRegions,
        resultImage: result.resultImage,
      },
      create: {
        bookingId,
        similarityScore: result.similarityScore,
        flaggedRegions: result.flaggedRegions,
        resultImage: result.resultImage,
      },
    });

    console.log(`[damageWorker] Successfully saved DamageReport for booking ${bookingId} with score ${result.similarityScore}`);
  } catch (error) {
    console.error(`[damageWorker] Error processing damage analysis for booking ${bookingId}:`, error);
    throw error;
  }
}
