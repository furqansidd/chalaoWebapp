"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  paymentMethod?: string;
  paymentReceipt?: string;
  car: {
    make: string;
    model: string;
  };
  renter: {
    name: string;
    email: string;
  };
}

interface Dispute {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  booking: {
    id: string;
    car: {
      make: string;
      model: string;
    };
    renter: {
      name: string;
    };
  };
}

export default function AdminConsolePage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"IBFT" | "DISPUTES">("IBFT");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "IBFT") {
        const res = await fetch("/api/admin/bookings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load bookings queue.");
        // Filter to display pending manual IBFT payments
        const filtered = (data.bookings || []).filter(
          (b: Booking) => b.paymentMethod === "IBFT" && b.status === "PENDING_PAYMENT"
        );
        setBookings(filtered);
      } else {
        const res = await fetch("/api/admin/disputes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load disputes queue.");
        setDisputes(data.disputes || []);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred fetching admin data.");
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
    if (user && user.role === "ADMIN" && token) {
      fetchData();
    }
  }, [user, token, activeTab]);

  const handleVerifyPayment = async (bookingId: string) => {
    if (!token) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/verify-payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");

      setSuccessMsg("Payment verified and booking finalized!");
      fetchData();
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisputeAction = async (disputeId: string, action: "RESOLVE" | "DISMISS") => {
    if (!token) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/disputes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ disputeId, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Arbitration action failed.");

      setSuccessMsg(`Dispute status updated: ${action}D successfully.`);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Arbitration update failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ color: "var(--text-secondary)" }}>Verifying credentials...</p>
      </div>
    );
  }

  if (!user) return null;

  if (user.role !== "ADMIN") {
    return (
      <div className="glass-panel" style={{ maxWidth: "600px", margin: "80px auto", padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "var(--error)", marginBottom: "16px" }}>Access Denied</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
          You must be an administrator to access this console dashboard.
        </p>
        <button className="btn btn-primary" onClick={() => router.push("/")}>
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "32px", background: "linear-gradient(135deg, #fff 0%, #9ca3af 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        Admin Console Dashboard
      </h1>

      {successMsg && (
        <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "var(--success)", padding: "16px", borderRadius: "12px", marginBottom: "32px", fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--error)", padding: "16px", borderRadius: "12px", marginBottom: "32px", fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* Admin Tab Controller Navigation */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "16px" }}>
        <button
          className={`btn ${activeTab === "IBFT" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("IBFT")}
          style={{ padding: "10px 24px" }}
        >
          IBFT Payments Queue
        </button>
        <button
          className={`btn ${activeTab === "DISPUTES" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("DISPUTES")}
          style={{ padding: "10px 24px" }}
        >
          Disputes Queue
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading queue items...</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: "32px" }}>
          {activeTab === "IBFT" && (
            <div>
              <h2 style={{ fontSize: "20px", marginBottom: "24px" }}>IBFT Bank Receipts Awaiting Action</h2>
              {bookings.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No pending bank payments to verify.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: "var(--text-muted)", fontSize: "13px" }}>
                        <th style={{ padding: "12px" }}>Vehicle</th>
                        <th style={{ padding: "12px" }}>Renter</th>
                        <th style={{ padding: "12px" }}>Total Price</th>
                        <th style={{ padding: "12px" }}>Bank Receipt</th>
                        <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "14px" }}>
                          <td style={{ padding: "16px 12px", fontWeight: 600 }}>{b.car.make} {b.car.model}</td>
                          <td style={{ padding: "16px 12px" }}>{b.renter.name}</td>
                          <td style={{ padding: "16px 12px" }}>Rs. {b.totalPrice.toLocaleString()}</td>
                          <td style={{ padding: "16px 12px" }}>
                            {b.paymentReceipt ? (
                              <a href={b.paymentReceipt} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>
                                View Receipt Link
                              </a>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>Missing receipt file</span>
                            )}
                          </td>
                          <td style={{ padding: "16px 12px", textAlign: "right" }}>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleVerifyPayment(b.id)}
                              disabled={actionLoading}
                              style={{ padding: "6px 16px", fontSize: "13px" }}
                            >
                              Verify Payment
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "DISPUTES" && (
            <div>
              <h2 style={{ fontSize: "20px", marginBottom: "24px" }}>Active Renter Disputes Arbitration Queue</h2>
              {disputes.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No active disputes requiring resolution.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: "var(--text-muted)", fontSize: "13px" }}>
                        <th style={{ padding: "12px" }}>Reason / Issue</th>
                        <th style={{ padding: "12px" }}>Vehicle</th>
                        <th style={{ padding: "12px" }}>Renter</th>
                        <th style={{ padding: "12px" }}>Status</th>
                        <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disputes.map((d) => (
                        <tr key={d.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "14px" }}>
                          <td style={{ padding: "16px 12px", color: "var(--text-secondary)" }}>{d.reason}</td>
                          <td style={{ padding: "16px 12px", fontWeight: 600 }}>{d.booking.car.make} {d.booking.car.model}</td>
                          <td style={{ padding: "16px 12px" }}>{d.booking.renter.name}</td>
                          <td style={{ padding: "16px 12px" }}>
                            <span className="badge badge-medium" style={{ textTransform: "uppercase" }}>{d.status}</span>
                          </td>
                          <td style={{ padding: "16px 12px", textAlign: "right", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleDisputeAction(d.id, "RESOLVE")}
                              disabled={actionLoading}
                              style={{ padding: "6px 12px", fontSize: "13px" }}
                            >
                              Resolve Dispute
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleDisputeAction(d.id, "DISMISS")}
                              disabled={actionLoading}
                              style={{ padding: "6px 12px", fontSize: "13px", color: "var(--error)", borderColor: "rgba(239, 68, 68, 0.2)" }}
                            >
                              Dismiss
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
