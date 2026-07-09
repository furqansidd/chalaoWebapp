"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";

export default function CreateCarPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [city, setCity] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          make,
          model,
          year: parseInt(year, 10),
          plateNumber,
          city,
          basePrice: parseFloat(basePrice),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create listing.");
      }

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ color: "var(--text-secondary)" }}>Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Let the useEffect redirect
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "75vh",
      }}
    >
      <div className="glass-card" style={{ width: "100%", maxWidth: "550px" }}>
        <h2 style={{ fontSize: "28px", marginBottom: "8px", textAlign: "center" }}>
          List a New Vehicle
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          Offer your car for rent in the Chalao marketplace
        </p>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "var(--error)",
              padding: "12px 16px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 500,
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid-cols-2">
            <div className="form-group">
              <label htmlFor="make" className="form-label">
                Make
              </label>
              <input
                id="make"
                type="text"
                className="form-input"
                required
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Honda, Toyota"
              />
            </div>

            <div className="form-group">
              <label htmlFor="model" className="form-label">
                Model
              </label>
              <input
                id="model"
                type="text"
                className="form-input"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Civic, Corolla"
              />
            </div>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label htmlFor="year" className="form-label">
                Year
              </label>
              <input
                id="year"
                type="number"
                min="1990"
                max={new Date().getFullYear() + 1}
                className="form-input"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2022"
              />
            </div>

            <div className="form-group">
              <label htmlFor="plateNumber" className="form-label">
                Plate Number
              </label>
              <input
                id="plateNumber"
                type="text"
                className="form-input"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="e.g. ABC-1234"
              />
            </div>
          </div>

          <div className="grid-cols-2" style={{ marginBottom: "28px" }}>
            <div className="form-group">
              <label htmlFor="city" className="form-label">
                City
              </label>
              <select
                id="city"
                className="form-input"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  appearance: "none",
                  background: "rgba(255, 255, 255, 0.03) url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E') no-repeat right 16px center",
                }}
              >
                <option value="" disabled style={{ background: "#0b0f19" }}>
                  Select City
                </option>
                <option value="KARACHI" style={{ background: "#0b0f19" }}>
                  Karachi
                </option>
                <option value="LAHORE" style={{ background: "#0b0f19" }}>
                  Lahore
                </option>
                <option value="ISLAMABAD" style={{ background: "#0b0f19" }}>
                  Islamabad
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="basePrice" className="form-label">
                Base Daily Price (Rs.)
              </label>
              <input
                id="basePrice"
                type="number"
                min="1"
                className="form-input"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="e.g. 5000"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "14px", fontSize: "16px" }}
          >
            {loading ? "Creating Listing..." : "Create Listing"}
          </button>
        </form>
      </div>
    </div>
  );
}
