import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FileText,
  CheckSquare,
  ShoppingCart,
  Receipt,
  BarChart2,
  Bell,
  Users,
  LogOut,
  Building2,
  Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  {
    to: "/vendors",
    label: "Vendors",
    icon: <Building2 size={18} />,
    roles: ["ADMIN", "OFFICR", "MANAGER"],
  },
  { to: "/rfqs", label: "RFQs", icon: <Package size={18} /> },
  { to: "/quotations", label: "Quotations", icon: <FileText size={18} /> },
  {
    to: "/approvals",
    label: "Approvals",
    icon: <CheckSquare size={18} />,
    roles: ["ADMIN", "MANAGER", "OFFICR"],
  },
  {
    to: "/purchase-orders",
    label: "Purchase Orders",
    icon: <ShoppingCart size={18} />,
    roles: ["ADMIN", "OFFICR", "MANAGER"],
  },
  { to: "/invoices", label: "Invoices", icon: <Receipt size={18} /> },
  {
    to: "/activity",
    label: "Activity",
    icon: <Activity size={18} />,
    roles: ["ADMIN", "OFFICR", "MANAGER"],
  },
  {
    to: "/reports",
    label: "Reports",
    icon: <BarChart2 size={18} />,
    roles: ["ADMIN", "OFFICR", "MANAGER"],
  },
  { to: "/notifications", label: "Notifications", icon: <Bell size={18} /> },
  { to: "/users", label: "Users", icon: <Users size={18} />, roles: ["ADMIN"] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filtered = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  const roleBadgeColor: Record<Role, string> = {
    ADMIN: "bg-red-500",
    OFFICR: "bg-blue-500",
    MANAGER: "bg-purple-500",
    VENDOR: "bg-green-500",
  };

  return (
    <aside className="sidebar">
      <div
        style={{
          padding: "1.25rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "1.125rem", color: "white" }}>
          VendorBridge
        </div>
        <div
          style={{
            fontSize: "0.7rem",
            color: "#93c5fd",
            marginTop: "0.125rem",
          }}
        >
          Procurement ERP
        </div>
      </div>

      <nav
        style={{
          flex: 1,
          padding: "0.75rem 0",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}
      >
        {filtered.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-item${isActive ? " active" : ""}`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div
          style={{
            padding: "1rem",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                color: "white",
              }}
            >
              {user.name[0].toUpperCase()}
            </div>
            <div>
              <div
                style={{ fontSize: "0.8rem", fontWeight: 600, color: "white" }}
              >
                {user.name}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#93c5fd" }}>
                {user.role}
              </div>
              {user.organization?.name && (
                <div style={{ fontSize: "0.65rem", color: "#BFDBFE" }}>
                  {user.organization.name}
                </div>
              )}
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={handleLogout}
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      )}
    </aside>
  );
}
