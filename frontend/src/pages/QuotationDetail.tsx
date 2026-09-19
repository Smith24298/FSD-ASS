import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeft, Send, CheckCircle2, Clock, FileText, ShoppingCart, Building2, Pencil } from 'lucide-react';

export default function QuotationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const fetchQuotation = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/quotations/${id}`);
      setQuotation(res.data?.data);
    } catch (err) {
      console.error('Failed to load quotation', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitDraft = async () => {
    setSubmitting(true);
    try {
      await api.post(`/quotations/${id}/submit`);
      setMessage('Quotation submitted successfully!');
      fetchQuotation();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit draft quotation');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading quotation details...</div>;
  }

  if (!quotation) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Quotation not found.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/quotations')}>
          <ArrowLeft size={16} /> Back to Quotations
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/quotations')} style={{ marginBottom: '0.75rem' }}>
          <ArrowLeft size={16} /> Back to Quotations
        </button>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 className="page-title">Quotation: {quotation.quotationNumber || `QT-${quotation.id}`}</h1>
              <StatusBadge status={quotation.status} />
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              For RFQ: <Link to={`/rfqs/${quotation.rfq?.id || quotation.rfqId}`} style={{ color: '#1E3A8A', fontWeight: 600 }}>{quotation.rfq?.rfqNumber} — {quotation.rfq?.title}</Link>
            </p>
          </div>

          <div>
            {quotation.status === 'DRAFT' && user?.role === 'VENDOR' && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link to={`/rfqs/${quotation.rfqId}/quote?quotationId=${quotation.id}`} className="btn btn-secondary">
                  <Pencil size={16} /> Edit Draft
                </Link>
                <button className="btn btn-primary" onClick={handleSubmitDraft} disabled={submitting}>
                  <Send size={16} /> Submit Quotation Now
                </button>
              </div>
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
        {/* Left Column: Items Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#111827' }}>
              Quoted Items ({quotation.items?.length || 0})
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
                {quotation.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      {item.description && <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{item.description}</div>}
                    </td>
                    <td>{item.quantity} {item.unit || 'Units'}</td>
                    <td>₹{Number(item.unitPrice).toLocaleString()}</td>
                    <td>₹{Number(item.tax || 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ₹{((Number(item.unitPrice) * item.quantity) + Number(item.tax || 0)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes & Commercial Terms */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
              Commercial & Delivery Terms
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 500 }}>Lead Time</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
                  {quotation.deliveryDays ? `${quotation.deliveryDays} Days` : 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 500 }}>Payment Terms</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
                  {quotation.paymentTerms || 'Standard'}
                </div>
              </div>
            </div>
            {quotation.notes && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 500 }}>Notes & Warranty</div>
                <p style={{ fontSize: '0.85rem', color: '#374151', margin: '0.25rem 0 0 0' }}>{quotation.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Financial Summary & Supplier Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Financial Summary
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>₹{Number(quotation.subtotal || quotation.totalAmount).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>Tax:</span>
                <span style={{ fontWeight: 600 }}>₹{Number(quotation.tax || 0).toLocaleString()}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Grand Total:</span>
              <span style={{ fontWeight: 800, fontSize: '1.35rem', color: '#1E3A8A' }}>
                ₹{Number(quotation.totalAmount).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Supplier Info (For Officers) */}
          {user?.role !== 'VENDOR' && quotation.vendor && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
                Supplier Information
              </h2>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{quotation.vendor.profile?.companyName || quotation.vendor.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem' }}>Contact: {quotation.vendor.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Email: {quotation.vendor.email}</div>
              {quotation.vendor.profile?.gstNumber && (
                <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>GST: {quotation.vendor.profile.gstNumber}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
