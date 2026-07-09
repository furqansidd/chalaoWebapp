"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
      }}
    >
      <div className="glass-card" style={{ width: "100%", maxWidth: "440px" }}>
        <h2 style={{ fontSize: "28px", marginBottom: "8px", textAlign: "center" }}>
          Create Account
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          Join Chalao to easily rent premium vehicles or list your own
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
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ali Khan"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="form-group" style={{ marginBottom: "28px" }}>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "14px", fontSize: "16px" }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            textAlign: "center",
            marginTop: "24px",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/auth/login"
            style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
