import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import {
  Package,
  ArrowLeft,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Plus,
  Eye,
  Award,
} from "lucide-react";

export default function RFQDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [myQuotation, setMyQuotation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchRfqDetails();
  }, [id]);

  const fetchRfqDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/rfqs/${id}`);
      const rfqData = res.data?.data;
      setRfq(rfqData);

      // Fetch activity log
      try {
        const actRes = await api.get(`/rfqs/${id}/activity`);
        setActivities(actRes.data?.data || []);
      } catch (e) {}

      // If vendor, check if already submitted quotation
      if (user?.role === "VENDOR") {
        try {
          const qRes = await api.get(`/quotations?rfqId=${id}`);
          const quotes = qRes.data?.data?.data || qRes.data?.data || [];
          if (quotes.length > 0) {
            setMyQuotation(quotes[0]);
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error("Failed to load RFQ", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    setActionLoading(true);
    try {
      await api.post(`/rfqs/${id}/publish`);
      setMessage("RFQ successfully published to invited vendors");
      fetchRfqDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to publish RFQ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    setActionLoading(true);
    try {
      await api.post(`/rfqs/${id}/close`);
      setMessage("RFQ has been closed for new quotations");
      fetchRfqDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to close RFQ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAward = async (quotationId: number) => {
    if (
      !confirm(
        "Are you sure you want to award this RFQ to this quotation? This will create a Purchase Order.",
      )
    )
      return;
    setActionLoading(true);
    try {
      await api.post(`/rfqs/${id}/award`, { quotationId });
      setMessage("RFQ awarded successfully! Purchase Order generated.");
      fetchRfqDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to award RFQ");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading RFQ details...
      </div>
    );
  }

  if (!rfq) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>RFQ not found or access denied.</p>
        <button className="btn btn-secondary" onClick={() => navigate("/rfqs")}>
          <ArrowLeft size={16} /> Back to RFQs
        </button>
      </div>
    );
  }

  const isDeadlinePassed =
    rfq.quotationDeadline && new Date(rfq.quotationDeadline) < new Date();

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/rfqs")}
          style={{ marginBottom: "0.75rem" }}
        >
          <ArrowLeft size={16} /> Back to RFQs
        </button>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <h1 className="page-title">{rfq.title}</h1>
              <StatusBadge status={rfq.status} />
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "0.85rem",
                color: "#6B7280",
                marginTop: "0.25rem",
              }}
            >
              Reference: {rfq.rfqNumber}
            </div>
          </div>

          <div
            style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
          >
            {user?.role === "OFFICR" && rfq.status === "DRAFT" && (
              <button
                className="btn btn-primary"
                onClick={handlePublish}
                disabled={actionLoading}
              >
                <Send size={16} /> Publish RFQ
              </button>
            )}

            {user?.role !== "VENDOR" &&
              (rfq.status === "OPEN" ||
                rfq.status === "PUBLISHED" ||
                rfq.status === "SHORTLISTED") && (
                <Link
                  to={`/rfqs/${rfq.id}/compare`}
                  className="btn btn-primary"
                >
                  Compare Quotations
                </Link>
              )}

            {user?.role === "VENDOR" &&
              (rfq.status === "OPEN" || rfq.status === "PUBLISHED") &&
              !myQuotation &&
              !isDeadlinePassed && (
                <Link to={`/rfqs/${rfq.id}/quote`} className="btn btn-success">
                  <Plus size={16} /> Submit Quotation
                </Link>
              )}

            {user?.role === "VENDOR" &&
              myQuotation &&
              myQuotation.status === "DRAFT" &&
              !isDeadlinePassed && (
                <Link
                  to={`/rfqs/${rfq.id}/quote?quotationId=${myQuotation.id}`}
                  className="btn btn-success"
                >
                  <Send size={16} /> Edit Draft Quotation
                </Link>
              )}

            {user?.role === "VENDOR" &&
              myQuotation &&
              myQuotation.status !== "DRAFT" && (
                <Link
                  to={`/quotations/${myQuotation.id}`}
                  className="btn btn-secondary"
                >
                  <Eye size={16} /> View My Quotation
                </Link>
              )}
          </div>
        </div>
      </div>

      {message && (
        <div
          style={{
            background: "#D1FAE5",
            border: "1px solid #6EE7B7",
            color: "#065F46",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "1.5rem",
        }}
      >
        {/* Left Column: Scope, Line Items, Quotations */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Scope & Overview */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "0.75rem",
              }}
            >
              Description & Specifications
            </h2>
            <p
              style={{
                color: "#4B5563",
                fontSize: "0.9rem",
                lineHeight: "1.5",
                margin: 0,
              }}
            >
              {rfq.description || "No detailed description provided."}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "1rem",
                marginTop: "1.25rem",
                borderTop: "1px solid #F3F4F6",
                paddingTop: "1rem",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  Quotation Deadline
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: isDeadlinePassed ? "#EF4444" : "#111827",
                    marginTop: "0.2rem",
                  }}
                >
                  {rfq.quotationDeadline
                    ? new Date(rfq.quotationDeadline).toLocaleString()
                    : "Open"}
                  {isDeadlinePassed && " (Passed)"}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  Target Delivery
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#111827",
                    marginTop: "0.2rem",
                  }}
                >
                  {rfq.expectedDeliveryDate
                    ? new Date(rfq.expectedDeliveryDate).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  Estimated Budget
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#111827",
                    marginTop: "0.2rem",
                  }}
                >
                  {rfq.budget
                    ? `₹${Number(rfq.budget).toLocaleString()}`
                    : "Unspecified"}
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div
              style={{
                padding: "1rem 1.5rem",
                borderBottom: "1px solid #E5E7EB",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Requested Items ({rfq.items?.length || 0})
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Specifications</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Est. Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {rfq.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td style={{ color: "#6B7280", fontSize: "0.85rem" }}>
                      {item.description || "—"}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                    <td>{item.unit || "Units"}</td>
                    <td>
                      {item.estimatedUnitPrice
                        ? `₹${Number(item.estimatedUnitPrice).toLocaleString()}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Received Quotations (Only for Internal Staff) */}
          {user?.role !== "VENDOR" && (
            <div className="card" style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  Received Quotations ({rfq.quotations?.length || 0})
                </h2>
                {rfq.quotations?.length > 1 && (
                  <Link
                    to={`/rfqs/${rfq.id}/compare`}
                    className="btn btn-primary"
                    style={{ fontSize: "0.8rem" }}
                  >
                    Compare All ({rfq.quotations.length})
                  </Link>
                )}
              </div>

              {!rfq.quotations || rfq.quotations.length === 0 ? (
                <p
                  style={{ color: "#6B7280", fontSize: "0.875rem", margin: 0 }}
                >
                  No quotations submitted yet.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {rfq.quotations.map((q: any) => (
                    <div
                      key={q.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "1rem",
                        background: "#F9FAFB",
                        borderRadius: "0.5rem",
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: "#111827",
                          }}
                        >
                          {q.vendor?.name || "Vendor"} — ₹
                          {Number(q.totalAmount).toLocaleString()}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#6B7280",
                            marginTop: "0.2rem",
                          }}
                        >
                          Quote #{q.quotationNumber || q.id} • Delivery:{" "}
                          {q.deliveryDays || "N/A"} days • Submitted:{" "}
                          {new Date(
                            q.submittedAt || q.createdAt,
                          ).toLocaleDateString()}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <StatusBadge status={q.status} />
                        <Link
                          to={`/quotations/${q.id}`}
                          className="btn btn-secondary"
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.35rem 0.6rem",
                          }}
                        >
                          Review
                        </Link>
                        {user?.role === "OFFICR" &&
                          rfq.status === "SHORTLISTED" &&
                          q.status === "APPROVED" && (
                            <button
                              className="btn btn-success"
                              style={{
                                fontSize: "0.75rem",
                                padding: "0.35rem 0.6rem",
                              }}
                              onClick={() => handleAward(q.id)}
                              disabled={actionLoading}
                            >
                              <Award size={14} /> Award
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Suppliers Invited & Timeline */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Invited Suppliers */}
          {user?.role !== "VENDOR" && (
            <div className="card" style={{ padding: "1.5rem" }}>
              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "0.75rem",
                }}
              >
                Invited Suppliers ({rfq.vendors?.length || 0})
              </h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {rfq.vendors?.map((inv: any) => (
                  <div
                    key={inv.vendorId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem 0",
                      borderBottom: "1px solid #F3F4F6",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        {inv.vendor?.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                        {inv.vendor?.email}
                      </div>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Timeline */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "1rem",
              }}
            >
              Procurement Timeline
            </h2>
            {activities.length === 0 ? (
              <p style={{ color: "#6B7280", fontSize: "0.8rem", margin: 0 }}>
                No timeline activities logged yet.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {activities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      fontSize: "0.8rem",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#3B82F6",
                        marginTop: 5,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: "#111827" }}>
                        {act.event.replace(/_/g, " ")}
                      </div>
                      <div style={{ color: "#4B5563", marginTop: "0.1rem" }}>
                        {act.description}
                      </div>
                      <div
                        style={{
                          color: "#9CA3AF",
                          fontSize: "0.7rem",
                          marginTop: "0.1rem",
                        }}
                      >
                        {new Date(act.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
