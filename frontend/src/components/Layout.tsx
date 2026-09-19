import React, { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { Bell, User, CheckCircle2 } from "lucide-react";
import api from "../lib/api";

export function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api
        .get("/notifications?limit=20")
        .then(() => api.get("/notifications/unread-count"))
        .then((res) =>
          setUnreadCount(res.data.data?.count ?? res.data.count ?? 0),
        )
        .catch(() => {});
    }
  }, [user, location.pathname]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F9FAFB",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1E3A8A" }}
          >
            Loading VendorBridge ERP...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9FAFB" }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "auto",
        }}
      >
        {/* Top Navbar */}
        <header
          style={{
            height: "60px",
            background: "white",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2rem",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <span style={{ fontSize: "0.875rem", color: "#6B7280" }}>
              Role:
            </span>
            <span
              className={`badge ${
                user.role === "ADMIN"
                  ? "badge-red"
                  : user.role === "MANAGER"
                    ? "badge-purple"
                    : user.role === "OFFICR"
                      ? "badge-blue"
                      : "badge-green"
              }`}
            >
              {user.role}
            </span>
          </div>

          <div
            style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}
          >
            <Link
              to="/notifications"
              style={{
                position: "relative",
                color: "#4B5563",
                textDecoration: "none",
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "#EF4444",
                    color: "white",
                    borderRadius: "9999px",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    padding: "1px 5px",
                    lineHeight: "1",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#1E3A8A",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#111827",
                }}
              >
                {user.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          style={{
            flex: 1,
            padding: "2rem",
            maxWidth: "1400px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
