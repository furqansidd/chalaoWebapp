"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import Link from "next/link";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  city: string;
  basePrice: number;
}

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  car: {
    make: string;
    model: string;
  };
  renter?: {
    name: string;
  };
}

interface DashboardData {
  metrics: {
    renter: { totalSpent: number; activeBookings: number };
    owner: { totalEarnings: number; activeBookings: number; totalCars: number };
  };
  renterBookings: Booking[];
  ownerBookings: Booking[];
  ownerCars: Car[];
}

export default function DashboardPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"RENTER" | "OWNER">("RENTER");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const [renterRes, ownerRes] = await Promise.all([
        fetch("/api/dashboard?role=renter", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/dashboard?role=owner", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const renterJson = await renterRes.json();
      const ownerJson = await ownerRes.json();

      if (!renterRes.ok) throw new Error(renterJson.error || "Failed to load renter data.");
      if (!ownerRes.ok) throw new Error(ownerJson.error || "Failed to load owner data.");

      setData({
        metrics: {
          renter: {
            totalSpent: renterJson.stats.totalSpent,
            activeBookings: renterJson.stats.activeBookingsCount,
          },
          owner: {
            totalEarnings: ownerJson.stats.totalEarnings,
            activeBookings: ownerJson.stats.pendingApprovalsCount,
            totalCars: ownerJson.stats.carsCount,
          },
        },
        renterBookings: renterJson.bookings,
        ownerBookings: ownerJson.bookings,
        ownerCars: ownerJson.cars,
      });
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchDashboardData();
    }
  }, [user, token]);

  if (isLoading || (!user && isLoading)) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ color: "var(--text-secondary)" }}>Verifying session...</p>
      </div>
    );
  }

  if (!user) return null;

  const renderRenterMode = () => {
    if (!data) return null;
    const { renter } = data.metrics;
    return (
      <div>
        <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>My Rentals (Renter Mode)</h2>

        {/* Renter Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "40px" }} className="grid-cols-2">
          <div className="glass-panel" style={{ padding: "24px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Spent on Rentals
            </span>
            <p style={{ fontSize: "32px", fontWeight: 800, color: "var(--primary)", marginTop: "8px" }}>
              Rs. {renter.totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="glass-panel" style={{ padding: "24px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Active Bookings
            </span>
            <p style={{ fontSize: "32px", fontWeight: 800, color: "var(--success)", marginTop: "8px" }}>
              {renter.activeBookings}
            </p>
          </div>
        </div>

        {/* Rentals List */}
        <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Booking History</h3>
        {data.renterBookings.length === 0 ? (
          <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)" }}>You have not booked any rides yet.</p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: "16px" }}>
              Browse Cars
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {data.renterBookings.map((b) => (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="glass-panel"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 24px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div>
                  <h4 style={{ fontSize: "17px", marginBottom: "4px" }}>
                    {b.car.make} {b.car.model}
                  </h4>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    Dates: {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                    Rs. {b.totalPrice.toLocaleString()}
                  </span>
                  <span className={`badge badge-${b.status.toLowerCase() === "pending_approval" ? "medium" : "low"}`}>
                    {b.status.replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderOwnerMode = () => {
    if (!data) return null;
    const { owner } = data.metrics;
    return (
      <div>
        <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>My Vehicles (Owner Mode)</h2>

        {/* Owner Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginBottom: "40px" }} className="grid-cols-2">
          <div className="glass-panel" style={{ padding: "24px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Total Earnings
            </span>
            <p style={{ fontSize: "32px", fontWeight: 800, color: "var(--primary)", marginTop: "8px" }}>
              Rs. {owner.totalEarnings.toLocaleString()}
            </p>
          </div>
          <div className="glass-panel" style={{ padding: "24px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Listed Cars
            </span>
            <p style={{ fontSize: "32px", fontWeight: 800, color: "var(--success)", marginTop: "8px" }}>
              {owner.totalCars}
            </p>
          </div>
          <div className="glass-panel" style={{ padding: "24px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Pending Approvals
            </span>
            <p style={{ fontSize: "32px", fontWeight: 800, color: "var(--warning)", marginTop: "8px" }}>
              {owner.activeBookings}
            </p>
          </div>
        </div>

        {/* Listed Cars */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "18px" }}>My Registered Cars</h3>
          <Link href="/cars/new" className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "14px" }}>
            + List a New Car
          </Link>
        </div>

        {data.ownerCars.length === 0 ? (
          <div className="glass-panel" style={{ padding: "32px", textAlign: "center", marginBottom: "40px" }}>
            <p style={{ color: "var(--text-secondary)" }}>You have not listed any cars yet.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px", marginBottom: "40px" }}>
            {data.ownerCars.map((c) => (
              <div key={c.id} className="glass-panel" style={{ padding: "20px" }}>
                <h4 style={{ fontSize: "16px", marginBottom: "4px" }}>
                  {c.make} {c.model}
                </h4>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Plate: {c.plateNumber}</p>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--primary)", marginTop: "12px" }}>
                  Rs. {(c.basePrice ?? 0).toLocaleString()} / day
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Incoming Bookings */}
        <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Customer Bookings</h3>
        {data.ownerBookings.length === 0 ? (
          <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)" }}>No customer bookings found for your vehicles.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {data.ownerBookings.map((b) => (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="glass-panel"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 24px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div>
                  <h4 style={{ fontSize: "17px", marginBottom: "4px" }}>
                    {b.car.make} {b.car.model}
                  </h4>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Renter: {b.renter?.name} • Dates: {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                    Rs. {b.totalPrice.toLocaleString()}
                  </span>
                  <span className={`badge badge-${b.status.toLowerCase() === "pending_approval" ? "medium" : "low"}`}>
                    {b.status.replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <div>
          <h1 style={{ fontSize: "36px", letterSpacing: "-0.02em" }}>My Dashboard</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Manage bookings, rental records, and vehicle earnings
          </p>
        </div>

        {/* View Switcher Toggle */}
        <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", borderRadius: "10px", padding: "4px" }}>
          <button
            onClick={() => setMode("RENTER")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "RENTER" ? "var(--primary)" : "transparent",
              color: mode === "RENTER" ? "#fff" : "var(--text-secondary)",
              transition: "all 0.2s",
            }}
          >
            Renter View
          </button>
          <button
            onClick={() => setMode("OWNER")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "OWNER" ? "var(--primary)" : "transparent",
              color: mode === "OWNER" ? "#fff" : "var(--text-secondary)",
              transition: "all 0.2s",
            }}
          >
            Switch to Owner
          </button>
        </div>
      </div>

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

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading stats...</p>
        </div>
      ) : (
        mode === "RENTER" ? renderRenterMode() : renderOwnerMode()
      )}
    </div>
  );
}
