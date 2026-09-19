import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeft, Receipt, CheckCircle2, Building2, ShoppingCart, FileText, Send } from 'lucide-react';

export default function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [po, setPo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPo();
  }, [id]);

  const fetchPo = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/purchase-orders/${id}`);
      setPo(res.data?.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load purchase order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!confirm('Generate official invoice for this purchase order?')) return;
    setGeneratingInvoice(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/invoices', { purchaseOrderId: parseInt(id!, 10) });
      const invoiceId = res.data?.data?.id;
      setMessage('Invoice generated successfully!');
      navigate(`/invoices/${invoiceId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading purchase order...</div>;
  }

  if (error || !po) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{error || 'Purchase order not found.'}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/purchase-orders')}>
          <ArrowLeft size={16} /> Back to Purchase Orders
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/purchase-orders')} style={{ marginBottom: '0.75rem' }}>
          <ArrowLeft size={16} /> Back to Purchase Orders
        </button>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 className="page-title">Purchase Order: {po.poNumber}</h1>
              <StatusBadge status={po.status} />
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Issued by {po.createdBy?.name || 'Procurement Team'} on {new Date(po.issueDate).toLocaleDateString()}
            </p>
          </div>

          <div>
            {!po.invoice ? (
              <button
                className="btn btn-primary"
                onClick={handleGenerateInvoice}
                disabled={generatingInvoice || po.status === 'CANCELLED'}
              >
                <Receipt size={16} /> Generate Invoice
              </button>
            ) : (
              <Link to={`/invoices/${po.invoice.id}`} className="btn btn-secondary">
                <Receipt size={16} /> View Generated Invoice ({po.invoice.invoiceNumber})
              </Link>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: PO Items Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#111827' }}>
              Purchase Order Items ({po.items?.length || 0})
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Item & Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Tax</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {po.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      {item.description && <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{item.description}</div>}
                    </td>
                    <td>{item.quantity} {item.unit || 'Units'}</td>
                    <td>₹{Number(item.unitPrice).toLocaleString()}</td>
                    <td>₹{Number(item.tax).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ₹{Number(item.total).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Terms and Conditions */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
              Terms & Conditions
            </h2>
            <p style={{ color: '#4B5563', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
              {po.termsAndConditions || 'Payment to be processed within 30 days of invoice receipt and quality verification. All deliveries must strictly conform to original RFQ specifications.'}
            </p>
          </div>
        </div>

        {/* Right Column: Financial Breakdown & Vendor Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Financial Breakdown */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Financial Summary
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>₹{Number(po.subtotal).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>Total Tax:</span>
                <span style={{ fontWeight: 600 }}>₹{Number(po.tax).toLocaleString()}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Grand Total:</span>
              <span style={{ fontWeight: 800, fontSize: '1.35rem', color: '#1E3A8A' }}>
                ₹{Number(po.total).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
              Vendor Information
            </h2>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {po.vendor?.profile?.companyName || po.vendor?.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem' }}>Contact: {po.vendor?.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Email: {po.vendor?.email}</div>
            {po.vendor?.profile?.gstNumber && (
              <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>GST: {po.vendor.profile.gstNumber}</div>
            )}
            {po.vendor?.profile?.address && (
              <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem' }}>Address: {po.vendor.profile.address}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
