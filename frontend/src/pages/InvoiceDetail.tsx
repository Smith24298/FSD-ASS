import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeft, Printer, Download, Mail, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailNotes, setEmailNotes] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/invoices/${id}`);
      const data = res.data?.data;
      setInvoice(data);
      if (data?.vendor?.email) {
        setEmailRecipient(data.vendor.email);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load invoice');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate/download invoice PDF');
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingEmail(true);
    setError('');
    setMessage('');
    try {
      await api.post(`/invoices/${id}/email`, {
        recipientEmail: emailRecipient,
        customMessage: emailNotes,
      });
      setShowEmailModal(false);
      setMessage(`Invoice successfully dispatched via email to ${emailRecipient}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to email invoice');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!confirm('Mark this invoice as PAID?')) return;
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/invoices/${id}/status`, { status: 'PAID', notes: 'Payment confirmed by accounts' });
      setMessage('Invoice marked as PAID.');
      fetchInvoice();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update invoice status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading invoice...</div>;
  }

  if (error || !invoice) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{error || 'Invoice not found.'}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={16} /> Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="no-print" style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/invoices')} style={{ marginBottom: '0.75rem' }}>
          <ArrowLeft size={16} /> Back to Invoices
        </button>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 className="page-title">Invoice #{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Linked PO: <Link to={`/purchase-orders/${invoice.purchaseOrderId}`} style={{ color: '#1E3A8A', fontWeight: 600 }}>{invoice.purchaseOrder?.poNumber}</Link>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={handlePrint}>
              <Printer size={16} /> Print
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadPdf}>
              <Download size={16} /> Download PDF
            </button>
            <button className="btn btn-primary" onClick={() => setShowEmailModal(true)}>
              <Mail size={16} /> Email Invoice
            </button>
            {user?.role !== 'VENDOR' && invoice.status !== 'PAID' && (
              <button className="btn btn-success" onClick={handleMarkAsPaid} disabled={isUpdatingStatus}>
                <CheckCircle size={16} /> Mark as Paid
              </button>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className="no-print" style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {message}
        </div>
      )}

      {/* Printable Invoice Sheet */}
      <div className="card" style={{ padding: '2.5rem', maxWidth: '900px', margin: '0 auto', background: 'white' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1E3A8A', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E3A8A', margin: 0 }}>VendorBridge ERP</h1>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '0.25rem 0 0 0' }}>Procurement & Vendor Management ERP</p>
            <p style={{ fontSize: '0.8rem', color: '#4B5563', margin: '0.25rem 0 0 0' }}>New Delhi, India • procurement@vendorbridge.local</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>INVOICE</h2>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: '#1E3A8A', marginTop: '0.25rem' }}>
              {invoice.invoiceNumber}
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        {/* Billed To / From Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SUPPLIER / VENDOR (BILLED BY)
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827', marginTop: '0.35rem' }}>
              {invoice.vendor?.profile?.companyName || invoice.vendor?.name}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#4B5563', marginTop: '0.2rem' }}>Contact: {invoice.vendor?.name}</div>
            <div style={{ fontSize: '0.85rem', color: '#4B5563' }}>Email: {invoice.vendor?.email}</div>
            {invoice.vendor?.profile?.gstNumber && (
              <div style={{ fontSize: '0.85rem', color: '#4B5563' }}>GSTIN: {invoice.vendor.profile.gstNumber}</div>
            )}
            {invoice.vendor?.profile?.address && (
              <div style={{ fontSize: '0.85rem', color: '#4B5563' }}>{invoice.vendor.profile.address}</div>
            )}
          </div>

          <div style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#6B7280', display: 'block', fontSize: '0.75rem' }}>Invoice Date</span>
                <span style={{ fontWeight: 600 }}>{new Date(invoice.issueDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span style={{ color: '#6B7280', display: 'block', fontSize: '0.75rem' }}>Due Date</span>
                <span style={{ fontWeight: 600 }}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Net 30'}</span>
              </div>
              <div>
                <span style={{ color: '#6B7280', display: 'block', fontSize: '0.75rem' }}>Purchase Order #</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{invoice.purchaseOrder?.poNumber}</span>
              </div>
              <div>
                <span style={{ color: '#6B7280', display: 'block', fontSize: '0.75rem' }}>RFQ Number</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{invoice.purchaseOrder?.rfq?.rfqNumber || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <table className="table" style={{ marginBottom: '2rem' }}>
          <thead>
            <tr style={{ background: '#F3F4F6' }}>
              <th style={{ width: '40%' }}>Item Description</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price (₹)</th>
              <th style={{ textAlign: 'right' }}>Tax / GST (₹)</th>
              <th style={{ textAlign: 'right' }}>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: any) => (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  {item.description && <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{item.description}</div>}
                </td>
                <td style={{ textAlign: 'center' }}>{item.quantity} {item.unit || ''}</td>
                <td style={{ textAlign: 'right' }}>₹{Number(item.unitPrice).toFixed(2)}</td>
                <td style={{ textAlign: 'right' }}>₹{Number(item.tax).toFixed(2)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Breakdown */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: '#6B7280' }}>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>₹{Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: '#6B7280' }}>Tax / GST:</span>
              <span style={{ fontWeight: 600 }}>₹{Number(invoice.tax).toFixed(2)}</span>
            </div>
            <div style={{ borderTop: '2px solid #1E3A8A', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>Total Due:</span>
              <span style={{ fontWeight: 800, fontSize: '1.35rem', color: '#1E3A8A' }}>
                ₹{Number(invoice.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes & Footer */}
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1.5rem', fontSize: '0.8rem', color: '#6B7280' }}>
          <div style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>Payment Instructions:</div>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            {invoice.notes || 'Please remit payment directly via bank transfer referencing the invoice number above within the stipulated due date.'}
          </p>
          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: '#9CA3AF' }}>
            Generated electronically by VendorBridge Procurement ERP Platform.
          </div>
        </div>
      </div>

      {/* Email Invoice Modal */}
      {showEmailModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
              Email Invoice PDF
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1rem' }}>
              Dispatches an automated email with attached PDF copy of {invoice.invoiceNumber}.
            </p>

            <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Recipient Email Address *</label>
                <input
                  type="email"
                  required
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  placeholder="accounts@vendorcompany.com"
                />
              </div>

              <div className="form-group">
                <label>Custom Message (Optional)</label>
                <textarea
                  rows={3}
                  value={emailNotes}
                  onChange={(e) => setEmailNotes(e.target.value)}
                  placeholder="Additional notes for vendor accounts team..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEmailModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSendingEmail}>
                  {isSendingEmail ? 'Dispatching Email...' : 'Send Invoice Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
