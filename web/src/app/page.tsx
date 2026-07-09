"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  city: string;
  basePrice: number;
  images: string[];
}

export default function BrowsePage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch cars with filters
  const fetchCars = async (filterCity = "", filterStart = "", filterEnd = "") => {
    setLoading(true);
    setError(null);
    try {
      let query = "/api/cars";
      const params = new URLSearchParams();

      if (filterCity) {
        params.append("city", filterCity);
      }

      if (filterStart || filterEnd) {
        if (!filterStart || !filterEnd) {
          throw new Error("Both start date and end date are required to filter by availability.");
        }
        // Normalize dates to full days in UTC
        const startIso = new Date(filterStart + "T00:00:00.000Z").toISOString();
        const endIso = new Date(filterEnd + "T23:59:59.000Z").toISOString();

        params.append("startDate", startIso);
        params.append("endDate", endIso);
      }

      const queryString = params.toString();
      if (queryString) {
        query += `?${queryString}`;
      }

      const res = await fetch(query, { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to retrieve cars.");
      }

      setCars(data.cars || []);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCars(city, startDate, endDate);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "40px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "44px",
            fontWeight: 800,
            marginBottom: "12px",
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.03em",
          }}
        >
          Find Your Perfect Ride
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
          Browse premium verified vehicles with dynamic pricing and absolute lock guarantees
        </p>
      </header>

      {/* Search Filter Form */}
      <form
        onSubmit={handleSearch}
        className="glass-panel"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr)) 120px",
          gap: "20px",
          padding: "24px",
          marginBottom: "40px",
          alignItems: "flex-end",
        }}
      >
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="city" className="form-label">
            Select City
          </label>
          <select
            id="city"
            className="form-input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{
              appearance: "none",
              background: "rgba(255, 255, 255, 0.03) url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E') no-repeat right 16px center",
            }}
          >
            <option value="" style={{ background: "#0b0f19" }}>
              All Cities
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

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="startDate" className="form-label">
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="endDate" className="form-label">
            End Date
          </label>
          <input
            id="endDate"
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: "100%", height: "46px" }}>
          Search Cars
        </button>
      </form>

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
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid rgba(255,255,255,0.1)",
              borderTopColor: "var(--primary)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "var(--text-secondary)" }}>Searching listings...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : cars.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "60px 40px" }}>
          <h3 style={{ marginBottom: "8px", fontSize: "20px" }}>No Vehicles Available</h3>
          <p style={{ color: "var(--text-secondary)" }}>
            We couldn't find any vehicles matching your search criteria. Try a different city or dates.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "30px",
          }}
        >
          {cars.map((car) => (
            <Link
              key={car.id}
              href={`/cars/${car.id}`}
              className="glass-panel"
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "180px",
                  background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  position: "relative",
                }}
              >
                {car.images && car.images[0] ? (
                  <img
                    src={car.images[0]}
                    alt={`${car.make} ${car.model}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  "🚗 Photo Available on Request"
                )}
                <span
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "rgba(10, 15, 26, 0.7)",
                    backdropFilter: "blur(4px)",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {car.city}
                </span>
              </div>
              <div style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "18px", marginBottom: "4px" }}>
                  {car.make} {car.model}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
                  Year: {car.year} • Plate: {car.plateNumber}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    paddingTop: "14px",
                  }}
                >
                  <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Daily Rate</span>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary)" }}>
                    Rs. {car.basePrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
