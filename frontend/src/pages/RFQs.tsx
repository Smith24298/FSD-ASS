import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { Package, Plus, Search, Filter, Calendar, Users, Eye } from 'lucide-react';
import type { RFQ } from '../types';

export default function RFQs() {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRfqs();
  }, [search, status, page]);

  const fetchRfqs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const res = await api.get(`/rfqs?${params.toString()}`);
      setRfqs(res.data?.data?.data || res.data?.data || []);
      setTotal(res.data?.data?.meta?.total || 0);
    } catch (err) {
      console.error('Failed to load RFQs', err);
    } finally {
      setIsLoading(false);
    }
  };

  const statuses = ['', 'DRAFT', 'PUBLISHED', 'OPEN', 'SHORTLISTED', 'AWARDED', 'CLOSED', 'EXPIRED', 'CANCELLED'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Requests for Quotation (RFQs)</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage sourcing requirements, invited vendors, deadlines, and submissions.
          </p>
        </div>
        {user?.role === 'OFFICR' && (
          <Link to="/rfqs/create" className="btn btn-primary">
            <Plus size={16} /> Create New RFQ
          </Link>
        )}
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search by RFQ number or title..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '2rem' }}
          />
        </div>

        <div style={{ width: '200px' }}>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {statuses.filter(Boolean).map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* RFQs Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>RFQ Reference & Title</th>
              <th>Status</th>
              <th>Quotation Deadline</th>
              <th>Expected Delivery</th>
              <th>Budget</th>
              <th>Created Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  Loading RFQs...
                </td>
              </tr>
            ) : rfqs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  No RFQs found.
                </td>
              </tr>
            ) : (
              rfqs.map((rfq) => (
                <tr key={rfq.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#111827' }}>
                      {rfq.title}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6B7280' }}>
                      {rfq.rfqNumber}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={rfq.status} />
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#4B5563' }}>
                      {rfq.quotationDeadline ? new Date(rfq.quotationDeadline).toLocaleDateString() : 'None'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#4B5563' }}>
                      {rfq.expectedDeliveryDate ? new Date(rfq.expectedDeliveryDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>
                      {rfq.budget ? `₹${Number(rfq.budget).toLocaleString()}` : 'Unspecified'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                      {new Date(rfq.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link to={`/rfqs/${rfq.id}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>
                        <Eye size={14} /> View
                      </Link>
                      {user?.role !== 'VENDOR' && (rfq.status === 'OPEN' || rfq.status === 'CLOSED' || rfq.status === 'SHORTLISTED') && (
                        <Link to={`/rfqs/${rfq.id}/compare`} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>
                          Compare
                        </Link>
                      )}
                    </div>
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
