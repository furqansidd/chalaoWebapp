"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import Link from "next/link";

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  securityDeposit: number;
  paymentMethod?: string;
  paymentReceipt?: string;
  car: {
    id: string;
    make: string;
    model: string;
    ownerId: string;
    year: number;
    plateNumber: string;
    city: string;
    basePrice: number;
  };
  renter: {
    id: string;
    name: string;
    email: string;
    isVerified: boolean;
  };
}

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const bookingId = params.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Payment states
  const [payMethod, setPayMethod] = useState<"STRIPE" | "IBFT" >("STRIPE");
  const [receiptPath, setReceiptPath] = useState("");

  // Photo uploads states
  const [photoFront, setPhotoFront] = useState("");
  const [photoBack, setPhotoBack] = useState("");
  const [photoLeft, setPhotoLeft] = useState("");
  const [photoRight, setPhotoRight] = useState("");
  const [photoInterior, setPhotoInterior] = useState("");
  const [photoOdometer, setPhotoOdometer] = useState("");

  // Review & Dispute states
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  const fetchBooking = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load booking details.");
      }
      setBooking(data.booking);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && token) {
      fetchBooking();
    }
  }, [user, token, bookingId]);

  const handleApprove = async () => {
    if (!token || !booking) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Approval failed.");
      }

      setSuccessMsg("Booking request approved successfully!");
      fetchBooking();
    } catch (err: any) {
      setError(err.message || "An error occurred during approval.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !booking) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: any = { paymentMethod: payMethod };
      if (payMethod === "IBFT") {
        if (!receiptPath) {
          throw new Error("Please specify the receipt file path.");
        }
        payload.paymentReceipt = receiptPath;
      }

      const res = await fetch(`/api/bookings/${bookingId}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Payment recording failed.");
      }

      setSuccessMsg(payMethod === "IBFT" ? "Receipt uploaded successfully! Awaiting verification." : "Payment successful!");
      fetchBooking();
    } catch (err: any) {
      setError(err.message || "An error occurred during payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          preTripPhotos: {
            front: photoFront,
            back: photoBack,
            left: photoLeft,
            right: photoRight,
            interior: photoInterior,
            odometer: photoOdometer,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Check-in failed.");
      }

      setSuccessMsg("Pre-trip check-in completed successfully!");
      fetchBooking();
    } catch (err: any) {
      setError(err.message || "An error occurred during check-in.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          postTripPhotos: {
            front: photoFront,
            back: photoBack,
            left: photoLeft,
            right: photoRight,
            interior: photoInterior,
            odometer: photoOdometer,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Check-out failed.");
      }

      setSuccessMsg("Post-trip check-out submitted successfully!");
      fetchBooking();
    } catch (err: any) {
      setError(err.message || "An error occurred during check-out.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: parseInt(rating, 10),
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Review submission failed.");
      }

      setSuccessMsg("Review submitted successfully!");
      setComment("");
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting review.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/dispute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: disputeReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Dispute filing failed.");
      }

      setSuccessMsg("Dispute filed successfully!");
      setDisputeReason("");
      fetchBooking();
    } catch (err: any) {
      setError(err.message || "An error occurred while filing dispute.");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || (!user && isLoading)) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ color: "var(--text-secondary)" }}>Verifying session...</p>
      </div>
    );
  }

  if (!user) return null;

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading booking details...</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="glass-panel" style={{ maxWidth: "600px", margin: "40px auto", padding: "32px", textAlign: "center" }}>
        <h3 style={{ color: "var(--error)", marginBottom: "12px" }}>Error Loading Booking</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>{error}</p>
        <button className="btn btn-secondary" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!booking) return null;

  const isOwner = user.userId === booking.car.ownerId;
  const isRenter = user.userId === booking.renter.id;

  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING_APPROVAL":
      case "PENDING_PAYMENT":
        return "badge-medium";
      case "PAID":
      case "ACTIVE":
      case "COMPLETED":
        return "badge-low";
      case "CANCELLED":
        return "badge-high";
      default:
        return "badge-medium";
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <button
        className="btn btn-secondary"
        onClick={() => router.push("/dashboard")}
        style={{ marginBottom: "32px" }}
      >
        ← Back to Dashboard
      </button>

      {successMsg && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            color: "var(--success)",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "32px",
            fontWeight: 600,
          }}
        >
          {successMsg}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "var(--error)",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "32px",
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "40px" }} className="grid-cols-2">
        {/* Booking Specs details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {/* Car & Rental Profile */}
          <div className="glass-panel" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: "22px", marginBottom: "24px" }}>Booking Details</h2>
            <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>
              {booking.car.make} {booking.car.model}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
              Year: {booking.car.year} • Plate: {booking.car.plateNumber} • Location: {booking.car.city}
            </p>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Start Date
                </span>
                <p style={{ fontWeight: 600, fontSize: "15px", marginTop: "4px" }}>
                  {new Date(booking.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  End Date
                </span>
                <p style={{ fontWeight: 600, fontSize: "15px", marginTop: "4px" }}>
                  {new Date(booking.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Renter Profile details */}
          <div className="glass-panel" style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Renter Information</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ fontSize: "14px" }}>
                <span style={{ color: "var(--text-muted)" }}>Name:</span> {booking.renter.name}
              </p>
              <p style={{ fontSize: "14px" }}>
                <span style={{ color: "var(--text-muted)" }}>Email:</span> {booking.renter.email}
              </p>
              <p style={{ fontSize: "14px" }}>
                <span style={{ color: "var(--text-muted)" }}>Status:</span>{" "}
                <span style={{ color: booking.renter.isVerified ? "var(--success)" : "var(--warning)", fontWeight: 600 }}>
                  {booking.renter.isVerified ? "Verified" : "Pending Verification"}
                </span>
              </p>
            </div>
          </div>

          {/* Pricing Ledger */}
          <div className="glass-panel" style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Pricing Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Base Daily Rate</span>
                <span>Rs. {(booking.car.basePrice ?? 0).toLocaleString()} / day</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Dynamic Daily Rate (Risk-adjusted)</span>
                <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                  Rs. {Math.round((booking.totalPrice ?? 0) / (Math.max(1, Math.round(Math.abs(new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1))).toLocaleString()} / day
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px", fontSize: "15px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Security Deposit (Refundable)</span>
                <span style={{ fontWeight: 600 }}>Rs. {(booking.securityDeposit ?? 0).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px", fontSize: "18px", fontWeight: 700 }}>
                <span>Total Dynamic Price</span>
                <span style={{ color: "var(--primary)" }}>Rs. {(booking.totalPrice ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Computer-Vision Damage Report */}
          {booking.damageReport && (
            <div className="glass-panel" style={{ padding: "32px" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Computer-Vision Damage Report</h3>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--warning)", marginBottom: "16px" }}>
                Similarity Score: {Math.round(booking.damageReport.similarityScore * 100)}%
              </p>
              {booking.damageReport.resultImage && (
                <div style={{ marginBottom: "20px", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
                  <img
                    src={booking.damageReport.resultImage}
                    alt="Damage Analysis Heatmap"
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </div>
              )}
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Flagged Regions
                </span>
                <ul style={{ listStyleType: "none", padding: 0, marginTop: "8px" }}>
                  {(booking.damageReport.flaggedRegions as any[] || []).map((r, idx) => (
                    <li key={idx} style={{ fontSize: "14px", color: "var(--error)", marginBottom: "6px" }}>
                      • Zone: {r.angle} (Confidence: {Math.round(r.confidence * 100)}%)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Action Panel Column */}
        <div className="glass-panel" style={{ padding: "32px", alignSelf: "start" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Booking Status
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px", marginBottom: "32px" }}>
            <span className={`badge ${getStatusBadgeClass(booking.status)}`} style={{ fontSize: "14px", padding: "6px 14px" }}>
              {booking.status.replace(/_/g, " ")}
            </span>
          </div>

          {/* Action flows */}
          {isOwner && booking.status === "PENDING_APPROVAL" && (
            <div>
              <h4 style={{ fontSize: "16px", marginBottom: "12px" }}>Owner Actions</h4>
              <button
                className="btn btn-primary"
                onClick={handleApprove}
                disabled={actionLoading}
                style={{ width: "100%", padding: "12px" }}
              >
                {actionLoading ? "Processing..." : "Approve Booking"}
              </button>
            </div>
          )}

          {isRenter && booking.status === "PENDING_PAYMENT" && (
            <div>
              <h4 style={{ fontSize: "16px", marginBottom: "16px" }}>Make Payment</h4>
              <form onSubmit={handlePay}>
                <div className="form-group">
                  <label htmlFor="payMethod" className="form-label">Payment Method</label>
                  <select
                    id="payMethod"
                    className="form-input"
                    value={payMethod}
                    onChange={(e: any) => setPayMethod(e.target.value)}
                    style={{
                      appearance: "none",
                      background: "rgba(255, 255, 255, 0.03) url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E') no-repeat right 16px center",
                    }}
                  >
                    <option value="STRIPE" style={{ background: "#0b0f19" }}>Credit Card (Stripe)</option>
                    <option value="IBFT" style={{ background: "#0b0f19" }}>Bank Transfer (IBFT)</option>
                  </select>
                </div>

                {payMethod === "IBFT" && (
                  <div className="form-group" style={{ marginBottom: "20px" }}>
                    <label htmlFor="receiptPath" className="form-label">Receipt File Path</label>
                    <input
                      id="receiptPath"
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. C:/receipts/invoice101.png"
                      value={receiptPath}
                      onChange={(e) => setReceiptPath(e.target.value)}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "12px", marginTop: "8px" }}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : payMethod === "IBFT" ? "Upload Receipt" : "Pay with Credit Card"}
                </button>
              </form>
            </div>
          )}

          {!isOwner && !isRenter && (
            <p style={{ color: "var(--text-muted)", fontSize: "14px", fontStyle: "italic" }}>
              Viewing booking as Administrator.
            </p>
          )}

          {isRenter && booking.status === "PENDING_APPROVAL" && (
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
              Your reservation request is awaiting review by the vehicle owner. You will receive an update once they approve or reject the request.
            </p>
          )}

          {booking.status === "PAID" && !isRenter && (
            <p style={{ color: "var(--success)", fontSize: "14px", fontWeight: 500, lineHeight: "1.5" }}>
              ✓ Booking fully paid. Awaiting renter trip check-in.
            </p>
          )}

          {isRenter && booking.status === "PAID" && (
            <div>
              <h4 style={{ fontSize: "16px", marginBottom: "16px" }}>Start Pre-Trip Inspection</h4>
              <form onSubmit={handleCheckIn}>
                <div className="form-group">
                  <label htmlFor="frontPhoto" className="form-label">Front Photo Path</label>
                  <input id="frontPhoto" type="text" className="form-input" required value={photoFront} onChange={(e) => setPhotoFront(e.target.value)} placeholder="e.g. /photos/pre-front.jpg" />
                </div>
                <div className="form-group">
                  <label htmlFor="backPhoto" className="form-label">Back Photo Path</label>
                  <input id="backPhoto" type="text" className="form-input" required value={photoBack} onChange={(e) => setPhotoBack(e.target.value)} placeholder="e.g. /photos/pre-back.jpg" />
                </div>
                <div className="form-group">
                  <label htmlFor="leftPhoto" className="form-label">Left Photo Path</label>
                  <input id="leftPhoto" type="text" className="form-input" required value={photoLeft} onChange={(e) => setPhotoLeft(e.target.value)} placeholder="e.g. /photos/pre-left.jpg" />
                </div>
                <div className="form-group">
                  <label htmlFor="rightPhoto" className="form-label">Right Photo Path</label>
                  <input id="rightPhoto" type="text" className="form-input" required value={photoRight} onChange={(e) => setPhotoRight(e.target.value)} placeholder="e.g. /photos/pre-right.jpg" />
                </div>
                <div className="form-group">
                  <label htmlFor="interiorPhoto" className="form-label">Interior Photo Path</label>
                  <input id="interiorPhoto" type="text" className="form-input" required value={photoInterior} onChange={(e) => setPhotoInterior(e.target.value)} placeholder="e.g. /photos/pre-interior.jpg" />
                </div>
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label htmlFor="odometerPhoto" className="form-label">Odometer Photo Path</label>
                  <input id="odometerPhoto" type="text" className="form-input" required value={photoOdometer} onChange={(e) => setPhotoOdometer(e.target.value)} placeholder="e.g. /photos/pre-odometer.jpg" />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px" }} disabled={actionLoading}>
                  {actionLoading ? "Submitting Check-in..." : "Submit Pre-Trip Photos"}
                </button>
              </form>
            </div>
          )}

          {isRenter && booking.status === "ACTIVE" && (
            <div>
              <h4 style={{ fontSize: "16px", marginBottom: "16px" }}>Start Post-Trip Inspection</h4>
              <form onSubmit={handleCheckOut}>
                <div className="form-group">
                  <label htmlFor="frontPhoto" className="form-label">Front Photo Path</label>
                  <input id="frontPhoto" type="text" className="form-input" required value={photoFront} onChange={(e) => setPhotoFront(e.target.value)} placeholder="e.g. /photos/post-front.jpg" />
                </div>
                <div className="form-group">
                  <label htmlFor="backPhoto" className="form-label">Back Photo Path</label>
                  <input id="backPhoto" type="text" className="form-input" required value={photoBack} onChange={(e) => setPhotoBack(e.target.value)} placeholder="e.g. /photos/post-back.jpg" />
                </div>
                <div className="form-group">
                  <label htmlFor="leftPhoto" className="form-label">Left Photo Path</label>
                  <input id="leftPhoto" type="text" className="form-input" required value={photoLeft} onChange={(e) => setPhotoLeft(e.target.value)} placeholder="e.g. /photos/post-left.jpg" />
                </div>
                <div className="form-group">
                  <label htmlFor="rightPhoto" className="form-label">Right Photo Path</label>
                  <input id="rightPhoto" type="text" className="form-input" required value={photoRight} onChange={(e) => setPhotoRight(e.target.value)} placeholder="e.g. /photos/post-right.jpg" />
                </div>
                <div className="form-group">
                  <label htmlFor="interiorPhoto" className="form-label">Interior Photo Path</label>
                  <input id="interiorPhoto" type="text" className="form-input" required value={photoInterior} onChange={(e) => setPhotoInterior(e.target.value)} placeholder="e.g. /photos/post-interior.jpg" />
                </div>
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label htmlFor="odometerPhoto" className="form-label">Odometer Photo Path</label>
                  <input id="odometerPhoto" type="text" className="form-input" required value={photoOdometer} onChange={(e) => setPhotoOdometer(e.target.value)} placeholder="e.g. /photos/post-odometer.jpg" />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px" }} disabled={actionLoading}>
                  {actionLoading ? "Submitting Check-out..." : "Submit Post-Trip Photos"}
                </button>
              </form>
            </div>
          )}

          {isRenter && booking.status === "COMPLETED" && (
            <div style={{ marginTop: "32px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "24px" }}>
              <h4 style={{ fontSize: "16px", marginBottom: "16px" }}>Leave a Review</h4>
              <form onSubmit={handleReview}>
                <div className="form-group">
                  <label htmlFor="rating" className="form-label">Rating (1-5)</label>
                  <input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    required
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label htmlFor="comment" className="form-label">Comments</label>
                  <textarea
                    id="comment"
                    className="form-input"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe your rental experience..."
                    style={{ minHeight: "80px", resize: "vertical" }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "12px" }} disabled={actionLoading}>
                  Submit Review
                </button>
              </form>
            </div>
          )}

          {isRenter && (booking.status === "COMPLETED" || booking.status === "CHECKED_OUT") && (
            <div style={{ marginTop: "32px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "24px" }}>
              <h4 style={{ fontSize: "16px", marginBottom: "16px" }}>File a Dispute</h4>
              <form onSubmit={handleDispute}>
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label htmlFor="disputeReason" className="form-label">Dispute Reason</label>
                  <textarea
                    id="disputeReason"
                    className="form-input"
                    required
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Explain the issue with the trip or charges..."
                    style={{ minHeight: "80px", resize: "vertical" }}
                  />
                </div>
                <button type="submit" className="btn btn-secondary" style={{ width: "100%", padding: "12px", color: "var(--error)", borderColor: "rgba(239, 68, 68, 0.2)" }} disabled={actionLoading}>
                  Submit Dispute
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
