import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Plus, Trash2, ArrowLeft, Building2, Package, Calendar } from 'lucide-react';
import type { Vendor } from '../types';

export default function RFQCreate() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quotationDeadline, setQuotationDeadline] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [vendorIds, setVendorIds] = useState<number[]>([]);

  const [items, setItems] = useState([
    { name: '', description: '', quantity: 1, unit: 'Units', estimatedUnitPrice: '' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/vendors?status=ACTIVE&limit=100')
      .then((res) => {
        setVendors(res.data?.data?.data || res.data?.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingVendors(false));
  }, []);

  const handleAddItem = () => {
    setItems([...items, { name: '', description: '', quantity: 1, unit: 'Units', estimatedUnitPrice: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleVendorToggle = (vId: number) => {
    if (vendorIds.includes(vId)) {
      setVendorIds(vendorIds.filter((id) => id !== vId));
    } else {
      setVendorIds([...vendorIds, vId]);
    }
  };

  const handleSubmit = async (publish: boolean) => {
    setError('');

    if (!title) {
      setError('RFQ title is required');
      return;
    }
    if (items.some((it) => !it.name || Number(it.quantity) <= 0)) {
      setError('All items must have a name and quantity > 0');
      return;
    }
    if (publish) {
      if (!quotationDeadline) {
        setError('Quotation deadline is required to publish the RFQ');
        return;
      }
      if (vendorIds.length === 0) {
        setError('At least one vendor must be invited to publish');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title,
        description,
        quotationDeadline: quotationDeadline ? new Date(quotationDeadline).toISOString() : undefined,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : undefined,
        budget: budget ? parseFloat(budget) : undefined,
        currency,
        vendorIds,
        items: items.map((it) => ({
          name: it.name,
          description: it.description,
          quantity: parseInt(it.quantity.toString(), 10),
          unit: it.unit,
          estimatedUnitPrice: it.estimatedUnitPrice ? parseFloat(it.estimatedUnitPrice) : undefined,
        })),
      };

      const res = await api.post('/rfqs', payload);
      const rfqId = res.data?.data?.id;

      if (publish && rfqId) {
        await api.post(`/rfqs/${rfqId}/publish`);
      }

      navigate(`/rfqs/${rfqId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create RFQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate('/rfqs')} style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back to RFQs
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Create Request for Quotation (RFQ)</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Specify procurement items, deadlines, budget, and invite verified suppliers.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: RFQ Info & Line Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* General Details */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              RFQ Details
            </h2>
            <div className="form-group">
              <label>RFQ Title *</label>
              <input
                required
                placeholder="e.g. Procurement of High-Performance Laptops for Engineering"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Description & Scope of Work</label>
              <textarea
                rows={3}
                placeholder="Describe specifications, warranty requirements, and evaluation terms..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Quotation Deadline *</label>
                <input
                  type="datetime-local"
                  required
                  value={quotationDeadline}
                  onChange={(e) => setQuotationDeadline(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Expected Delivery Date</label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Estimated Total Budget</label>
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                Procurement Line Items ({items.length})
              </h2>
              <button type="button" className="btn btn-secondary" onClick={handleAddItem} style={{ fontSize: '0.8rem' }}>
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ padding: '1rem', background: '#F9FAFB', borderRadius: '0.5rem', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1E3A8A' }}>Item #{idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem' }}>Item Name *</label>
                      <input
                        required
                        placeholder="e.g. Dell Latitude 5540"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem' }}>Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10))}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem' }}>Unit</label>
                      <input
                        placeholder="Units / Pcs"
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem' }}>Item Description / Specifications</label>
                      <input
                        placeholder="Core i7, 32GB RAM, 1TB SSD"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem' }}>Est. Unit Price (₹)</label>
                      <input
                        type="number"
                        placeholder="Optional"
                        value={item.estimatedUnitPrice}
                        onChange={(e) => handleItemChange(idx, 'estimatedUnitPrice', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Invite Suppliers & Submit Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
              Invite Verified Suppliers
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '1rem' }}>
              Selected suppliers will receive invitations to submit competitive bids.
            </p>

            {loadingVendors ? (
              <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>Loading vendors...</p>
            ) : vendors.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>No active suppliers found in directory.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
                {vendors.map((v) => (
                  <label
                    key={v.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.6rem 0.75rem',
                      background: vendorIds.includes(v.id) ? '#EFF6FF' : '#F9FAFB',
                      border: vendorIds.includes(v.id) ? '1px solid #3B82F6' : '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={vendorIds.includes(v.id)}
                      onChange={() => handleVendorToggle(v.id)}
                      style={{ width: 'auto' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                        {v.profile?.companyName || v.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                        {v.profile?.category || 'Supplier'} • Rating: {v.profile?.rating || '4.5'}★
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Publishing Options
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Publishing...' : 'Save & Publish Immediately'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
