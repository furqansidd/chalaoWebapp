"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 40px",
        background: "rgba(10, 15, 26, 0.6)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <Link
          href="/"
          style={{
            fontSize: "24px",
            fontWeight: 800,
            textDecoration: "none",
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.03em",
          }}
        >
          Chalao
        </Link>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link
            href="/"
            style={{
              color: "#9ca3af",
              textDecoration: "none",
              fontSize: "15px",
              fontWeight: 500,
              transition: "color 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#f3f4f6")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#9ca3af")}
          >
            Browse
          </Link>
          {user && (
            <Link
              href="/dashboard"
              style={{
                color: "#9ca3af",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#f3f4f6")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#9ca3af")}
            >
              Dashboard
            </Link>
          )}
          {user && user.role === "ADMIN" && (
            <Link
              href="/admin"
              style={{
                color: "#ef4444",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#fca5a5")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#ef4444")}
            >
              Admin Console
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {user ? (
          <>
            <span
              style={{
                fontSize: "14px",
                color: "#9ca3af",
                fontWeight: 500,
                borderRight: "1px solid rgba(255,255,255,0.1)",
                paddingRight: "16px",
              }}
            >
              {user.email}
            </span>
            <button
              onClick={logout}
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
              }}
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              style={{
                color: "#f3f4f6",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                color: "#fff",
                textDecoration: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
              }}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
