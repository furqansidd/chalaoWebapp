"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      login(data.token);
      router.push("/");
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
          Welcome Back
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          Sign in to your Chalao account to browse and book vehicles
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
            {loading ? "Signing In..." : "Sign In"}
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
          Don't have an account?{" "}
          <Link
            href="/auth/register"
            style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
