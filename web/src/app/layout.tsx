import React from "react";
import "./globals.css";
import { AuthProvider } from "../lib/AuthContext";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "Chalao - Premium Vehicle Rental Portal",
  description: "Dynamic glassmorphic portal to browse, rent, and manage vehicles.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ padding: "40px" }}>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
