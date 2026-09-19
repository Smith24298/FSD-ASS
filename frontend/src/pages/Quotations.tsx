import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Search, Eye, Plus } from 'lucide-react';
import type { Quotation } from '../types';

export default function Quotations() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuotations();
  }, [status, page]);

  const fetchQuotations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (status) params.append('status', status);

      const res = await api.get(`/quotations?${params.toString()}`);
      setQuotations(res.data?.data?.data || res.data?.data || []);
      setTotal(res.data?.data?.meta?.total || 0);
    } catch (err) {
      console.error('Failed to load quotations', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Quotations</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {user?.role === 'VENDOR'
              ? 'Track submitted bids, drafts, and award statuses for your company.'
              : 'Review and evaluate competitive quotations submitted by suppliers.'}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '200px' }}>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="SHORTLISTED">SHORTLISTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="AWARDED">AWARDED</option>
            <option value="WITHDRAWN">WITHDRAWN</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Quote Reference</th>
              <th>RFQ Title</th>
              {user?.role !== 'VENDOR' && <th>Supplier</th>}
              <th>Total Amount</th>
              <th>Delivery Days</th>
              <th>Status</th>
              <th>Submission Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={user?.role !== 'VENDOR' ? 8 : 7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  Loading quotations...
                </td>
              </tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td colSpan={user?.role !== 'VENDOR' ? 8 : 7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  No quotations found.
                </td>
              </tr>
            ) : (
              quotations.map((q) => (
                <tr key={q.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1E3A8A' }}>
                      {q.quotationNumber || `QT-${q.id}`}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: '#111827' }}>
                      {q.rfq?.title || `RFQ #${q.rfqId}`}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6B7280' }}>
                      {q.rfq?.rfqNumber}
                    </div>
                  </td>
                  {user?.role !== 'VENDOR' && (
                    <td>
                      <div style={{ fontWeight: 500 }}>{q.vendor?.name || 'Vendor'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{q.vendor?.profile?.companyName}</div>
                    </td>
                  )}
                  <td>
                    <span style={{ fontWeight: 700, color: '#111827' }}>
                      ₹{Number(q.totalAmount || 0).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span>{q.deliveryDays ? `${q.deliveryDays} Days` : 'N/A'}</span>
                  </td>
                  <td>
                    <StatusBadge status={q.status} />
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                      {q.submittedAt ? new Date(q.submittedAt).toLocaleDateString() : 'Draft'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/quotations/${q.id}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>
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
