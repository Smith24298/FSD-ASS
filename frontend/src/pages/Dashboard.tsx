import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  Package, FileText, CheckSquare, ShoppingCart, Receipt,
  Users, TrendingUp, AlertCircle, PlusCircle, ArrowUpRight
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentRfqs, setRecentRfqs] = useState<any[]>([]);
  const [recentPos, setRecentPos] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, rfqRes, poRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => ({ data: { data: {} } })),
        api.get('/rfqs?limit=5').catch(() => ({ data: { data: [] } })),
        api.get('/purchase-orders?limit=5').catch(() => ({ data: { data: [] } })),
      ]);

      setStats(statsRes.data?.data || {});
      setRecentRfqs(rfqRes.data?.data?.data || rfqRes.data?.data || []);
      setRecentPos(poRes.data?.data?.data || poRes.data?.data || []);

      if (user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'OFFICR') {
        const appRes = await api.get('/approvals?status=PENDING&limit=5').catch(() => ({ data: { data: [] } }));
        setPendingApprovals(appRes.data?.data?.data || appRes.data?.data || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard metrics...</div>;
  }

  const roleTitleMap: Record<string, string> = {
    ADMIN: 'Administrator Dashboard',
    OFFICR: 'Procurement Officer Dashboard',
    MANAGER: 'Finance & Approval Manager Dashboard',
    VENDOR: 'Vendor Portal & Quotation Dashboard',
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{roleTitleMap[user?.role || ''] || 'Dashboard'}</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Welcome back, {user?.name}. Here is what's happening across your procurement workflow.
          </p>
        </div>
        {user?.role === 'OFFICR' && (
          <Link to="/rfqs/create" className="btn btn-primary">
            <PlusCircle size={16} /> Create RFQ
          </Link>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {user?.role !== 'VENDOR' ? (
          <>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Active RFQs</span>
                <Package size={20} color="#3B82F6" />
              </div>
              <div className="stat-value">{stats?.totalRfqs ?? recentRfqs.length}</div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Quotations Received</span>
                <FileText size={20} color="#F59E0B" />
              </div>
              <div className="stat-value">{stats?.totalQuotations ?? 0}</div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Pending Approvals</span>
                <CheckSquare size={20} color="#8B5CF6" />
              </div>
              <div className="stat-value">{stats?.pendingApprovals ?? pendingApprovals.length}</div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Purchase Orders</span>
                <ShoppingCart size={20} color="#10B981" />
              </div>
              <div className="stat-value">{stats?.totalPurchaseOrders ?? recentPos.length}</div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Total Spend</span>
                <TrendingUp size={20} color="#1E3A8A" />
              </div>
              <div className="stat-value">₹{Number(stats?.totalSpend || 0).toLocaleString()}</div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Invited RFQs</span>
                <Package size={20} color="#3B82F6" />
              </div>
              <div className="stat-value">{stats?.invitedRfqs ?? 0}</div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Submitted Quotations</span>
                <FileText size={20} color="#F59E0B" />
              </div>
              <div className="stat-value">{stats?.submittedQuotes ?? 0}</div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Awarded POs</span>
                <ShoppingCart size={20} color="#10B981" />
              </div>
              <div className="stat-value">{stats?.awardedPos ?? 0}</div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="stat-label">Invoices Generated</span>
                <Receipt size={20} color="#8B5CF6" />
              </div>
              <div className="stat-value">{stats?.totalInvoices ?? 0}</div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Pending Approvals (For Managers & Officers) */}
        {user?.role !== 'VENDOR' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                Pending Approvals
              </h2>
              <Link to="/approvals" style={{ fontSize: '0.875rem', color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontWeight: 500 }}>
                View All <ArrowUpRight size={14} />
              </Link>
            </div>

            {pendingApprovals.length === 0 ? (
              <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0, padding: '1.5rem 0', textAlign: 'center' }}>
                No pending approvals requiring attention.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingApprovals.map((app) => (
                  <div key={app.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: '#F9FAFB',
                    borderRadius: '0.5rem',
                    border: '1px solid #E5E7EB'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                        {app.rfq?.rfqNumber || `RFQ #${app.rfqId}`} — {app.rfq?.title || 'Quotation Approval'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        Requested by {app.requestedBy?.name || 'Officer'} on {new Date(app.requestedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Link to={`/approvals/${app.id}`} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent RFQs */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>
              Recent RFQs
            </h2>
            <Link to="/rfqs" style={{ fontSize: '0.875rem', color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontWeight: 500 }}>
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          {recentRfqs.length === 0 ? (
            <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0, padding: '1.5rem 0', textAlign: 'center' }}>
              No RFQs found.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentRfqs.map((rfq) => (
                <div key={rfq.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: '#F9FAFB',
                  borderRadius: '0.5rem',
                  border: '1px solid #E5E7EB'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                      {rfq.rfqNumber}: {rfq.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      Deadline: {rfq.quotationDeadline ? new Date(rfq.quotationDeadline).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <StatusBadge status={rfq.status} />
                    <Link to={`/rfqs/${rfq.id}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchase Orders */}
        {user?.role !== 'VENDOR' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                Recent Purchase Orders
              </h2>
              <Link to="/purchase-orders" style={{ fontSize: '0.875rem', color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontWeight: 500 }}>
                View All <ArrowUpRight size={14} />
              </Link>
            </div>

            {recentPos.length === 0 ? (
              <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0, padding: '1.5rem 0', textAlign: 'center' }}>
                No purchase orders created yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentPos.map((po) => (
                  <div key={po.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: '#F9FAFB',
                    borderRadius: '0.5rem',
                    border: '1px solid #E5E7EB'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                        {po.poNumber} — ₹{Number(po.total).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        Vendor: {po.vendor?.name || 'Vendor'} • Issued: {new Date(po.issueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <StatusBadge status={po.status} />
                      <Link to={`/purchase-orders/${po.id}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
