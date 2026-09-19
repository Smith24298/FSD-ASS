import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { ShoppingCart, Search, Eye, Plus, Receipt } from 'lucide-react';
import type { PurchaseOrder } from '../types';

export default function PurchaseOrders() {
  const { user } = useAuth();
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [status, page]);

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (status) params.append('status', status);

      const res = await api.get(`/purchase-orders?${params.toString()}`);
      setPos(res.data?.data?.data || res.data?.data || []);
      setTotal(res.data?.data?.meta?.total || 0);
    } catch (err) {
      console.error('Failed to load purchase orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Official legally-binding purchase contracts issued to awarded suppliers.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '200px' }}>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="ISSUED">ISSUED</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="FULFILLED">FULFILLED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>RFQ Reference</th>
              <th>Vendor</th>
              <th>Total Amount</th>
              <th>Issue Date</th>
              <th>Status</th>
              <th>Invoice</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  Loading purchase orders...
                </td>
              </tr>
            ) : pos.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  No purchase orders found.
                </td>
              </tr>
            ) : (
              pos.map((po) => (
                <tr key={po.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1E3A8A' }}>
                      {po.poNumber}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{po.rfq?.title || `RFQ #${po.rfqId}`}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6B7280' }}>{po.rfq?.rfqNumber}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{po.vendor?.profile?.companyName || po.vendor?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{po.vendor?.email}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#111827' }}>
                      ₹{Number(po.total).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>{new Date(po.issueDate).toLocaleDateString()}</span>
                  </td>
                  <td>
                    <StatusBadge status={po.status} />
                  </td>
                  <td>
                    {po.invoice ? (
                      <Link to={`/invoices/${po.invoice.id}`} className="badge badge-green" style={{ textDecoration: 'none' }}>
                        {po.invoice.invoiceNumber || 'Invoice Created'}
                      </Link>
                    ) : (
                      <span className="badge badge-gray">Not Generated</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/purchase-orders/${po.id}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>
                      <Eye size={14} /> View
                    </Link>
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
