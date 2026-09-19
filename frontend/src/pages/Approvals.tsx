import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { CheckSquare, Search, Eye, Check, X } from 'lucide-react';
import type { ApprovalRequest } from '../types';

export default function Approvals() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [status, setStatus] = useState('PENDING');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, [status]);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const res = await api.get(`/approvals?${params.toString()}`);
      setApprovals(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error('Failed to load approvals', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Procurement Approvals</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Review shortlisted supplier quotations and grant management authorization.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem' }}>
        {['PENDING', 'APPROVED', 'REJECTED', ''].map((st) => (
          <button
            key={st}
            onClick={() => setStatus(st)}
            className={`btn ${status === st ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          >
            {st === '' ? 'All Requests' : st}
          </button>
        ))}
      </div>

      {/* Approvals Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>RFQ Reference & Title</th>
              <th>Shortlisted Supplier</th>
              <th>Quoted Value</th>
              <th>Requested By</th>
              <th>Status</th>
              <th>Requested Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  Loading approvals...
                </td>
              </tr>
            ) : approvals.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  No {status.toLowerCase()} approval requests.
                </td>
              </tr>
            ) : (
              approvals.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#111827' }}>
                      {app.rfq?.title || `RFQ #${app.rfqId}`}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6B7280' }}>
                      {app.rfq?.rfqNumber}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {app.quotation?.vendor?.profile?.companyName || app.quotation?.vendor?.name || 'Selected Vendor'}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#111827' }}>
                      ₹{Number(app.quotation?.totalAmount || 0).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>{app.requestedBy?.name || 'Officer'}</span>
                  </td>
                  <td>
                    <StatusBadge status={app.status} />
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                      {app.requestedAt ? new Date(app.requestedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/approvals/${app.id}`} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                      Review Request
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
