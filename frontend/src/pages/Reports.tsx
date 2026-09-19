import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  BarChart2, Download, TrendingUp, DollarSign,
  Package, ShoppingCart, Star, CheckCircle, Award
} from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reports/analytics');
      setData(res.data?.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/reports/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'procurement-report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV report');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading analytics & reports...</div>;
  }

  const { procurementStats, spendingByVendor, spendingByCategory, monthlyTrends, vendorPerformance } = data || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Procurement Analytics & Reporting</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Executive spend analysis, supplier scorecards, and procurement lifecycle metrics.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleExportCsv} disabled={isExporting}>
          <Download size={16} /> {isExporting ? 'Exporting...' : 'Export CSV Report'}
        </button>
      </div>

      {/* KPI Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-label">Total Spend</span>
          <div className="stat-value">₹{Number(procurementStats?.totalProcurementSpend || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">RFQs Created</span>
          <div className="stat-value">{procurementStats?.rfqsCreated ?? 0}</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Quotations Received</span>
          <div className="stat-value">{procurementStats?.quotationsReceived ?? 0}</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Purchase Orders</span>
          <div className="stat-value">{procurementStats?.purchaseOrdersGenerated ?? 0}</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Invoices Issued</span>
          <div className="stat-value">{procurementStats?.invoicesGenerated ?? 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Spend by Category */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            Spend by Category
          </h2>
          {(!spendingByCategory || spendingByCategory.length === 0) ? (
            <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>No spend recorded by category.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {spendingByCategory.map((c: any) => (
                <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.category}</span>
                  <span style={{ fontWeight: 700, color: '#1E3A8A' }}>₹{Number(c.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spend by Top Vendors */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            Top Suppliers by Procurement Value
          </h2>
          {(!spendingByVendor || spendingByVendor.length === 0) ? (
            <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>No vendor spending recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {spendingByVendor.slice(0, 5).map((v: any) => (
                <div key={v.vendorId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v.companyName}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{v.poCount} Orders • {v.category}</div>
                  </div>
                  <span style={{ fontWeight: 700, color: '#059669' }}>₹{Number(v.totalSpend).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Supplier Performance Scorecards */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#111827' }}>
          Supplier Performance Scorecard
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>Category</th>
              <th>Rating</th>
              <th>RFQs Received</th>
              <th>Bids Submitted</th>
              <th>Response Rate</th>
              <th>Avg Lead Time</th>
              <th>Won POs</th>
              <th style={{ textAlign: 'right' }}>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {(!vendorPerformance || vendorPerformance.length === 0) ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  No performance metrics available yet.
                </td>
              </tr>
            ) : (
              vendorPerformance.map((vp: any) => (
                <tr key={vp.vendorId}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{vp.companyName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Code: {vp.vendorCode}</div>
                  </td>
                  <td>
                    <span className="badge badge-purple">{vp.category}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#D97706', fontWeight: 600 }}>
                      <Star size={13} fill="#F59E0B" color="#F59E0B" /> {vp.rating}
                    </div>
                  </td>
                  <td>{vp.rfqsReceived}</td>
                  <td>{vp.quotationsSubmitted}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: vp.responseRate >= 70 ? '#059669' : '#D97706' }}>
                      {vp.responseRate}%
                    </span>
                  </td>
                  <td>{vp.avgDeliveryDays ? `${vp.avgDeliveryDays}d` : 'N/A'}</td>
                  <td>
                    <span className="badge badge-green">{vp.purchaseOrdersCount}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#111827' }}>
                    ₹{Number(vp.totalProcurementValue).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
