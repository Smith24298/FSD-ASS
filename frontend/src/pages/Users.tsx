import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, UserCheck, UserX } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import type { Role, User } from "../types";

const roles: Role[] = ["OFFICR", "MANAGER", "VENDOR"];

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    userName: "",
    email: "",
    password: "",
    role: "OFFICR" as Role,
  });

  useEffect(() => {
    if (user?.role === "ADMIN") void loadUsers();
  }, [user]);

  if (user?.role !== "ADMIN") return <Navigate to="/dashboard" replace />;

  async function loadUsers() {
    try {
      const response = await api.get("/users?limit=100");
      setUsers(response.data?.data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to load organization users.",
      );
    }
  }

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/users", form);
      setMessage("User created in your organization.");
      setShowForm(false);
      setForm({
        name: "",
        userName: "",
        email: "",
        password: "",
        role: "OFFICR",
      });
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create user.");
    }
  }

  async function toggleUser(target: User) {
    try {
      await api.patch(`/users/${target.id}`, { isActive: !target.isActive });
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update user.");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Organization Users</h1>
          <p style={{ color: "#6B7280", fontSize: "0.875rem" }}>
            Manage users belonging to your organization.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm((value) => !value)}
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {message && (
        <div
          style={{
            color: "#065F46",
            background: "#D1FAE5",
            padding: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          {message}
        </div>
      )}
      {error && (
        <div
          style={{
            color: "#991B1B",
            background: "#FEE2E2",
            padding: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {showForm && (
        <form
          className="card"
          onSubmit={createUser}
          style={{
            padding: "1.25rem",
            marginBottom: "1.5rem",
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          <div className="form-group">
            <label htmlFor="user-name">Name</label>
            <input
              id="user-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="user-username">Username</label>
            <input
              id="user-username"
              required
              value={form.userName}
              onChange={(e) => setForm({ ...form, userName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="user-email">Email</label>
            <input
              id="user-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="user-password">Temporary password</label>
            <input
              id="user-password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="user-role">Role</label>
            <select
              id="user-role"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as Role })
              }
            >
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </div>
          <div style={{ alignSelf: "end" }}>
            <button className="btn btn-success" type="submit">
              Create User
            </button>
          </div>
        </form>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((target) => (
              <tr key={target.id}>
                <td>{target.name}</td>
                <td>{target.userName}</td>
                <td>{target.email}</td>
                <td>{target.role}</td>
                <td>{target.isActive ? "ACTIVE" : "INACTIVE"}</td>
                <td>
                  <button
                    className="btn btn-secondary"
                    onClick={() => toggleUser(target)}
                    disabled={target.id === user.id}
                  >
                    {target.isActive ? (
                      <>
                        <UserX size={14} /> Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} /> Activate
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p style={{ padding: "2rem", textAlign: "center", color: "#6B7280" }}>
            No users found in this organization.
          </p>
        )}
      </div>
    </div>
  );
}
