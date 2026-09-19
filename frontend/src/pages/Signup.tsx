import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Building2, CheckCircle2 } from "lucide-react";
import api from "../lib/api";

const initialForm = {
  name: "",
  userName: "",
  email: "",
  password: "",
  confirmPassword: "",
  mobileNumber: "",
  companyName: "",
  gstNumber: "",
  address: "",
};

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!/^\d{10}$/.test(form.mobileNumber)) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/register", {
        role: "VENDOR",
        user: {
          name: form.name,
          userName: form.userName,
          email: form.email,
          password: form.password,
        },
        profile: {
          mobileNumber: form.mobileNumber,
          companyName: form.companyName,
          gstNumber: form.gstNumber,
          address: form.address,
        },
      });
      setIsComplete(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Unable to create your account. Please check the details and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={successIconStyle}>
            <CheckCircle2 size={30} />
          </div>
          <h1 style={headingStyle}>Account created</h1>
          <p style={mutedTextStyle}>
            Your vendor account is ready. Sign in to view assigned RFQs and
            submit quotations.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={fullButtonStyle}
            onClick={() => navigate("/login")}
          >
            Continue to Sign In <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: 620 }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={logoStyle}>
            <Building2 size={26} />
          </div>
          <h1 style={headingStyle}>Join VendorBridge</h1>
          <p style={mutedTextStyle}>
            Create a vendor account to participate in procurement opportunities.
          </p>
        </div>

        {error && (
          <div style={errorStyle} role="alert">
            <AlertCircle size={16} /> <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div style={sectionTitleStyle}>Account details</div>
          <div style={gridStyle}>
            <Field
              id="name"
              label="Contact name"
              value={form.name}
              onChange={(value) => updateField("name", value)}
              required
            />
            <Field
              id="userName"
              label="Username"
              value={form.userName}
              onChange={(value) => updateField("userName", value)}
              required
              pattern="[a-z0-9_.]+"
            />
            <Field
              id="email"
              label="Email address"
              type="email"
              value={form.email}
              onChange={(value) => updateField("email", value)}
              required
            />
            <Field
              id="mobileNumber"
              label="Mobile number"
              type="tel"
              value={form.mobileNumber}
              onChange={(value) => updateField("mobileNumber", value)}
              required
              pattern="[0-9]{10}"
            />
            <Field
              id="password"
              label="Password"
              type="password"
              value={form.password}
              onChange={(value) => updateField("password", value)}
              required
              minLength={8}
            />
            <Field
              id="confirmPassword"
              label="Confirm password"
              type="password"
              value={form.confirmPassword}
              onChange={(value) => updateField("confirmPassword", value)}
              required
              minLength={8}
            />
          </div>

          <div style={sectionTitleStyle}>Business profile</div>
          <div style={gridStyle}>
            <Field
              id="companyName"
              label="Company name"
              value={form.companyName}
              onChange={(value) => updateField("companyName", value)}
              required
            />
            <Field
              id="gstNumber"
              label="GST number"
              value={form.gstNumber}
              onChange={(value) => updateField("gstNumber", value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="address">Business address</label>
            <textarea
              id="address"
              required
              rows={3}
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={fullButtonStyle}
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create vendor account"}{" "}
            <ArrowRight size={16} />
          </button>
        </form>

        <p
          style={{
            ...mutedTextStyle,
            textAlign: "center",
            marginTop: "1.25rem",
          }}
        >
          Already registered?{" "}
          <Link to="/login" style={{ color: "#1E3A8A", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  pattern,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  pattern?: string;
  minLength?: number;
}) {
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        pattern={pattern}
        minLength={minLength}
      />
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)",
  padding: "1.5rem",
};

const cardStyle: React.CSSProperties = {
  maxWidth: 440,
  width: "100%",
  background: "white",
  borderRadius: "1rem",
  padding: "2.25rem",
  boxShadow:
    "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
};

const logoStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  background: "#1E3A8A",
  color: "white",
  borderRadius: "0.75rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 1rem",
};

const successIconStyle: React.CSSProperties = {
  ...logoStyle,
  background: "#059669",
};
const headingStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};
const mutedTextStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "#6B7280",
  lineHeight: 1.5,
};
const fullButtonStyle: React.CSSProperties = {
  width: "100%",
  justifyContent: "center",
  padding: "0.75rem",
  marginTop: "0.5rem",
};
const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#374151",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "1px solid #E5E7EB",
  paddingBottom: "0.5rem",
};
const errorStyle: React.CSSProperties = {
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
};
