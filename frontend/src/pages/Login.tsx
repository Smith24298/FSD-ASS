import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, ArrowRight, UserCheck, AlertCircle } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: "440px",
          width: "100%",
          background: "white",
          borderRadius: "1rem",
          padding: "2.5rem",
          boxShadow:
            "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: "#1E3A8A",
              color: "white",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#111827",
              margin: 0,
            }}
          >
            VendorBridge ERP
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6B7280",
              marginTop: "0.25rem",
            }}
          >
            Procurement & Vendor Management Platform
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#FEE2E2",
              border: "1px solid #FCA5A5",
              color: "#B91C1C",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              placeholder="e.g. officer@vendorbridge.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "0.75rem",
              marginTop: "0.5rem",
            }}
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"} <ArrowRight size={16} />
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: "#6B7280",
            marginTop: "1.25rem",
          }}
        >
          New vendor?{" "}
          <Link to="/signup" style={{ color: "#1E3A8A", fontWeight: 600 }}>
            Create an account
          </Link>
        </p>

        <div
          style={{
            marginTop: "2rem",
            borderTop: "1px solid #E5E7EB",
            paddingTop: "1.5rem",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#6B7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.75rem",
              textAlign: "center",
            }}
          >
            Quick Demo Accounts
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", justifyContent: "center" }}
              onClick={() =>
                handleQuickLogin("e2e_officer@vendorbridge.com", "Password123!")
              }
            >
              Procurement Officer
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", justifyContent: "center" }}
              onClick={() =>
                handleQuickLogin("e2e_manager@vendorbridge.com", "Password123!")
              }
            >
              Finance Manager
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", justifyContent: "center" }}
              onClick={() =>
                handleQuickLogin("e2e_vendor1@example.com", "Password123!")
              }
            >
              Vendor A (TechCorp)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: "0.75rem", justifyContent: "center" }}
              onClick={() =>
                handleQuickLogin("e2e_admin@vendorbridge.com", "Password123!")
              }
            >
              System Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
