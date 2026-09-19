import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { Receipt, Search, Eye, Download, Mail } from 'lucide-react';
import type { Invoice } from '../types';

export default function Invoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, [status, page]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (status) params.append('status', status);

      const res = await api.get(`/invoices?${params.toString()}`);
      setInvoices(res.data?.data?.data || res.data?.data || []);
      setTotal(res.data?.data?.meta?.total || 0);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async (invoiceId: number, invoiceNum: string) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download invoice PDF');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Procurement Invoices</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage billing documents, printable PDF generation, and vendor email dispatches.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '200px' }}>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="ISSUED">ISSUED</option>
            <option value="PAID">PAID</option>
            <option value="OVERDUE">OVERDUE</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>PO Number</th>
              {user?.role !== 'VENDOR' && <th>Vendor</th>}
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={user?.role !== 'VENDOR' ? 8 : 7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={user?.role !== 'VENDOR' ? 8 : 7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1E3A8A' }}>
                      {inv.invoiceNumber}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {inv.purchaseOrder?.poNumber || `PO #${inv.purchaseOrderId}`}
                    </span>
                  </td>
                  {user?.role !== 'VENDOR' && (
                    <td>
                      <div style={{ fontWeight: 500 }}>{inv.vendor?.profile?.companyName || inv.vendor?.name}</div>
                    </td>
                  )}
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>{new Date(inv.issueDate).toLocaleDateString()}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Net 30'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#111827' }}>
                      ₹{Number(inv.total).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={inv.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                        onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </button>
                      <Link to={`/invoices/${inv.id}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>
                        <Eye size={14} /> View
                      </Link>
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
