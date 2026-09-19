import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { ArrowLeft, Save, Send, AlertCircle, DollarSign, Clock } from 'lucide-react';

export default function QuotationSubmit() {
  const { rfqId } = useParams<{ rfqId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const quotationId = searchParams.get('quotationId');

  const [rfq, setRfq] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [deliveryDays, setDeliveryDays] = useState<number>(7);
  const [validityDays, setValidityDays] = useState<number>(30);
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days from Invoice');
  const [currency, setCurrency] = useState('INR');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<any[]>([]);
  const [existingQuotation, setExistingQuotation] = useState<any>(null);

  useEffect(() => {
    fetchRfq();
  }, [rfqId]);

  const fetchRfq = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/rfqs/${rfqId}`);
      const data = res.data?.data;
      setRfq(data);

      let savedQuotation = null;
      if (quotationId) {
        const quotationRes = await api.get(`/quotations/${quotationId}`);
        savedQuotation = quotationRes.data?.data;
        if (savedQuotation?.status !== 'DRAFT' || Number(savedQuotation.rfqId) !== Number(rfqId)) {
          throw new Error('Only a draft quotation for this RFQ can be edited.');
        }
        setExistingQuotation(savedQuotation);
      }

      setItems((data?.items || []).map((it: any) => {
        const savedItem = savedQuotation?.items?.find((item: any) => item.rfqItemId === it.id);
        return {
          rfqItemId: it.id,
          name: it.name,
          description: it.description,
          quantity: savedItem?.quantity ?? it.quantity,
          unit: savedItem?.unit || it.unit || 'Units',
          unitPrice: savedItem?.unitPrice ?? '',
          tax: savedItem?.tax ?? 0,
          notes: savedItem?.notes || '',
        };
      }));
      if (savedQuotation) {
        setDeliveryDays(savedQuotation.deliveryDays || 7);
        setValidityDays(savedQuotation.validityDays || 30);
        setPaymentTerms(savedQuotation.paymentTerms || 'Net 30 Days from Invoice');
        setCurrency(savedQuotation.currency || 'INR');
        setNotes(savedQuotation.notes || '');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load RFQ details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + (Number(item.unitPrice || 0) * Number(item.quantity || 0)), 0);
  };

  const calculateTotalTax = () => {
    return items.reduce((acc, item) => acc + Number(item.tax || 0), 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateTotalTax();
  };

  const handleSubmit = async (isDraft: boolean) => {
    setError('');

    if (items.some((it) => !it.unitPrice || Number(it.unitPrice) <= 0)) {
      setError(isDraft
        ? 'Please provide a unit price for every item before saving a draft.'
        : 'Please provide a valid unit price (> 0) for all items');
      return;
    }

    if (!isDraft) {
      if (!deliveryDays || deliveryDays <= 0) {
        setError('Please specify valid delivery lead time in days');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        rfqId: parseInt(rfqId!, 10),
        isDraft,
        currency,
        paymentTerms,
        deliveryDays: deliveryDays ? parseInt(deliveryDays.toString(), 10) : undefined,
        validityDays: validityDays ? parseInt(validityDays.toString(), 10) : undefined,
        notes,
        items: items.map((it) => ({
          rfqItemId: it.rfqItemId,
          name: it.name,
          description: it.description,
          quantity: parseInt(it.quantity.toString(), 10),
          unit: it.unit,
          unitPrice: parseFloat(it.unitPrice.toString()),
          tax: it.tax ? parseFloat(it.tax.toString()) : 0,
          notes: it.notes,
        })),
      };

      const res = existingQuotation
        ? await api.patch(`/quotations/${existingQuotation.id}`, payload)
        : await api.post('/quotations', payload);
      const quoteId = res.data?.data?.id;
      navigate(`/quotations/${quoteId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading RFQ specifications...</div>;
  }

  if (!rfq) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>RFQ not found.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/rfqs')}>
          <ArrowLeft size={16} /> Back to RFQs
        </button>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate(`/rfqs/${rfqId}`)} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back to RFQ
      </button>

      <div className="page-header">
        <div>
            <h1 className="page-title">{existingQuotation ? 'Edit Draft Quotation' : 'Submit Supplier Quotation'}</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Quote pricing, delivery timelines, and payment terms for RFQ: <span style={{ fontWeight: 600, color: '#111827' }}>{rfq.rfqNumber} — {rfq.title}</span>
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Line Items Pricing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Itemized Quotation Breakdown
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item, idx) => {
                const lineSubtotal = Number(item.unitPrice || 0) * Number(item.quantity || 0);
                const lineTotal = lineSubtotal + Number(item.tax || 0);

                return (
                  <div key={idx} style={{ padding: '1.25rem', background: '#F9FAFB', borderRadius: '0.5rem', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E3A8A' }}>
                        Required: {item.quantity} {item.unit}
                      </span>
                    </div>
                    {item.description && (
                      <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0 0 0.75rem 0' }}>
                        Specs: {item.description}
                      </p>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem' }}>Unit Price (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem' }}>Tax / GST (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.tax}
                          onChange={(e) => handleItemChange(idx, 'tax', e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem' }}>Calculated Total</label>
                        <div style={{ padding: '0.5rem 0.75rem', background: '#E5E7EB', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                          ₹{lineTotal.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem' }}>
                      <input
                        placeholder="Item notes, make/brand offer (optional)"
                        value={item.notes}
                        onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quotation Terms */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Terms & Delivery Conditions
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Delivery Lead Time (Days) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(parseInt(e.target.value, 10))}
                />
              </div>
              <div className="form-group">
                <label>Quote Validity (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value, 10))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Payment Terms</label>
              <input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. Net 30 days after delivery"
              />
            </div>

            <div className="form-group">
              <label>Additional Notes / Warranty</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specify warranty period, shipping terms (e.g. FOB Destination), etc."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Summary & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Quotation Summary
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>₹{calculateSubtotal().toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#6B7280' }}>Estimated Tax (GST):</span>
                <span style={{ fontWeight: 600 }}>₹{calculateTotalTax().toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Grand Total:</span>
              <span style={{ fontWeight: 800, fontSize: '1.35rem', color: '#1E3A8A' }}>
                ₹{calculateGrandTotal().toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
              >
                <Send size={16} /> {existingQuotation ? 'Update & Submit Quotation' : 'Submit Quotation'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
              >
                <Save size={16} /> {existingQuotation ? 'Save Draft Changes' : 'Save as Draft'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
