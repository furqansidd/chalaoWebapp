"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  city: string;
  basePrice: number;
}

export default function CarDetailPage({ params }: { params: { id: string } }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const carId = params.id;

  const [car, setCar] = useState<Car | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await fetch(`/api/cars/${carId}`, { method: "GET" });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load car details.");
        }
        setCar(data.car);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [carId]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    setBookingLoading(true);
    setError(null);

    try {
      const startIso = new Date(startDate + "T00:00:00.000Z").toISOString();
      const endIso = new Date(endDate + "T23:59:59.000Z").toISOString();

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ carId, startDate: startIso, endDate: endIso }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Booking request failed.");
      }

      setBookingSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred while booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading vehicle details...</p>
      </div>
    );
  }

  if (error && !car) {
    return (
      <div className="glass-panel" style={{ maxWidth: "600px", margin: "40px auto", padding: "32px", textAlign: "center" }}>
        <h3 style={{ color: "var(--error)", marginBottom: "12px" }}>Error Loading Vehicle</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>{error}</p>
        <button className="btn btn-secondary" onClick={() => router.push("/")}>
          Back to Browse
        </button>
      </div>
    );
  }

  if (!car) return null;

  // Calculate dynamic summary
  let totalDays = 0;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <button
        className="btn btn-secondary"
        onClick={() => router.push("/")}
        style={{ marginBottom: "32px" }}
      >
        ← Back to Browse
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "40px" }} className="grid-cols-2">
        {/* Car Details Info */}
        <div className="glass-panel" style={{ padding: "32px" }}>
          <div
            style={{
              height: "300px",
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              color: "var(--text-muted)",
              marginBottom: "32px",
            }}
          >
            🚗 Vehicle Image
          </div>

          <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>
            {car.make} {car.model}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginBottom: "24px" }}>
            Year: {car.year} • Plate Number: {car.plateNumber}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              paddingTop: "24px",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Location
              </span>
              <p style={{ fontSize: "16px", fontWeight: 600, marginTop: "4px" }}>Location: {car.city}</p>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Base Price
              </span>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary)", marginTop: "4px" }}>
                Rs. {car.basePrice.toLocaleString()} / day
              </p>
            </div>
          </div>
        </div>

        {/* Booking Form Card */}
        <div className="glass-panel" style={{ padding: "32px", alignSelf: "start" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "24px" }}>Book this Ride</h2>

          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "var(--error)",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          {bookingSuccess && (
            <div
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                color: "var(--success)",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "20px",
              }}
            >
              Booking request created successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleBook}>
            <div className="form-group">
              <label htmlFor="startDate" className="form-label">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                className="form-input"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "24px" }}>
              <label htmlFor="endDate" className="form-label">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                className="form-input"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {totalDays > 0 && (
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "28px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Rental Duration</span>
                  <span style={{ fontWeight: 600 }}>{totalDays} days</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "8px" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Estimated Base Cost</span>
                  <span style={{ fontWeight: 700, color: "var(--primary)" }}>
                    Rs. {(car.basePrice * totalDays).toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px", fontStyle: "italic" }}>
                  * Final rate will be assessed dynamically based on renter risk factors.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px" }}
              disabled={bookingLoading || bookingSuccess}
            >
              {bookingLoading ? "Requesting..." : "Book Ride"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
