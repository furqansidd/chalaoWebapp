import { expect, test, describe, vi, beforeEach } from "vitest";
import { triggerDamageAnalysis } from "./damageWorker";
import { prisma } from "./prisma";

vi.mock("./prisma", () => {
  return {
    prisma: {
      booking: {
        findUnique: vi.fn(),
      },
      damageReport: {
        upsert: vi.fn(),
      },
    },
  };
});

describe("Background Damage Analysis Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  test("successfully processes damage analysis and saves DamageReport", async () => {
    // 1. Mock booking retrieved from DB
    const mockBooking = {
      id: "booking-uuid",
      preTripPhotos: { front: "pre-front.jpg" },
      postTripPhotos: { front: "post-front.jpg" },
    };
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockBooking as any);

    // 2. Mock FastAPI fetch response
    const mockFastAPIResult = {
      bookingId: "booking-uuid",
      similarityScore: 0.954,
      flaggedRegions: [{ angle: "front", bbox: [10, 10, 30, 30], confidence: 0.9 }],
      resultImage: "heatmap-diff.jpg",
    };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockFastAPIResult,
    } as any);

    // Run background worker
    await triggerDamageAnalysis("booking-uuid");

    // Verify booking query
    expect(prisma.booking.findUnique).toHaveBeenCalledWith({
      where: { id: "booking-uuid" },
    });

    // Verify fetch call parameters
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/api/v1/analyze-damage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booking_id: "booking-uuid",
        pre_photos: mockBooking.preTripPhotos,
        post_photos: mockBooking.postTripPhotos,
      }),
    });

    // Verify database upsert parameters
    expect(prisma.damageReport.upsert).toHaveBeenCalledWith({
      where: { bookingId: "booking-uuid" },
      update: {
        similarityScore: 0.954,
        flaggedRegions: mockFastAPIResult.flaggedRegions,
        resultImage: "heatmap-diff.jpg",
      },
      create: {
        bookingId: "booking-uuid",
        similarityScore: 0.954,
        flaggedRegions: mockFastAPIResult.flaggedRegions,
        resultImage: "heatmap-diff.jpg",
      },
    });
  });

  test("skips processing if photos are missing", async () => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue({
      id: "booking-uuid",
      preTripPhotos: null, // photos missing!
    } as any);

    await triggerDamageAnalysis("booking-uuid");
    expect(global.fetch).not.toHaveBeenCalled();
    expect(prisma.damageReport.upsert).not.toHaveBeenCalled();
  });
});
