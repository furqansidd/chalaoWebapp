import React, { useState } from "react";
import { useAuth } from "../../../lib/AuthContext";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
}

export default function ImageUpload({ label, value, onChange, required }: ImageUploadProps) {
  const { token } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!token) {
      setError("Not authenticated");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: "16px" }}>
      <label className="form-label">
        {label} {required && <span style={{ color: "var(--error)" }}>*</span>}
      </label>
      
      {value ? (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
          <img 
            src={value} 
            alt="Uploaded preview" 
            style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)" }} 
          />
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => onChange("")}
            style={{ padding: "6px 12px", fontSize: "12px" }}
          >
            Remove
          </button>
        </div>
      ) : (
        <div style={{ marginTop: "8px" }}>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="form-input"
            style={{ padding: "8px" }}
            disabled={isUploading}
          />
          {isUploading && <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Uploading...</p>}
          {error && <p style={{ fontSize: "12px", color: "var(--error)", marginTop: "4px" }}>{error}</p>}
        </div>
      )}
      {/* Hidden input to make HTML5 required validation work if we are enforcing it */}
      {required && !value && <input type="text" style={{ opacity: 0, height: 0, width: 0, position: 'absolute' }} required />}
    </div>
  );
}
