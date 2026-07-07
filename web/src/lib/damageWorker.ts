import { prisma } from "./prisma";

/**
 * Triggers asynchronous computer vision analysis on pre/post trip photos.
 * Hits FastAPI microservice and stores the generated DamageReport.
 */
export async function triggerDamageAnalysis(bookingId: string): Promise<void> {
  // Under TDD/YAGNI, this is a placeholder. Task 3 will connect this to FastAPI.
  console.log(`[damageWorker] Scheduled background damage analysis for booking ${bookingId}`);
}
