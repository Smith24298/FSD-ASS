import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { Building2, ArrowLeft, Star, Mail, Phone, MapPin, CheckCircle2, XCircle, FileText, ShoppingCart } from 'lucide-react';
import type { Vendor } from '../types';

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [rating, setRating] = useState<number>(4.5);
  const [category, setCategory] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/vendors/${id}`);
      const data = res.data?.data;
      setVendor(data);
      setNewStatus(data?.profile?.status || 'ACTIVE');
      setRating(data?.profile?.rating ? Number(data?.profile?.rating) : 4.5);
      setCategory(data?.profile?.category || 'Hardware');
    } catch (err) {
      console.error('Failed to load vendor', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    setIsUpdatingStatus(true);
    setUpdateMsg('');
    try {
      await api.patch(`/vendors/${id}/status`, { status: newStatus });
      setUpdateMsg('Vendor status successfully updated');
      fetchVendor();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update vendor status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMsg('');
    try {
      await api.put(`/vendors/${id}`, {
        category,
        rating: Number(rating),
      });
      setUpdateMsg('Vendor profile updated successfully');
      fetchVendor();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading vendor profile...</div>;
  }

  if (!vendor) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Vendor not found.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/vendors')}>
          <ArrowLeft size={16} /> Back to Vendors
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/vendors')} style={{ marginBottom: '0.75rem' }}>
          <ArrowLeft size={16} /> Back to Vendors
        </button>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <h1 className="page-title">{vendor.profile?.companyName || vendor.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: '#E5E7EB', padding: '2px 8px', borderRadius: '4px' }}>
                {vendor.profile?.vendorCode || `VND-${vendor.id}`}
              </span>
              <StatusBadge status={vendor.profile?.status || 'ACTIVE'} />
              <span className="badge badge-purple">{vendor.profile?.category || 'General'}</span>
            </div>
          </div>
        </div>
      </div>

      {updateMsg && (
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {updateMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Details & Quotations / POs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Company Details */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Company Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 500 }}>Contact Person</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#111827', marginTop: '0.25rem' }}>{vendor.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 500 }}>Email Address</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#111827', marginTop: '0.25rem' }}>{vendor.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 500 }}>GST / Tax Number</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#111827', marginTop: '0.25rem' }}>{vendor.profile?.gstNumber || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 500 }}>Mobile Number</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#111827', marginTop: '0.25rem' }}>{vendor.profile?.mobileNumber || 'N/A'}</div>
              </div>
            </div>
            <div style={{ marginTop: '1rem', borderTop: '1px solid #F3F4F6', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 500 }}>Registered Address</div>
              <div style={{ fontSize: '0.95rem', color: '#374151', marginTop: '0.25rem' }}>{vendor.profile?.address || 'No address provided'}</div>
            </div>
          </div>

          {/* Quotations History */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Submitted Quotations ({vendor.quotations?.length || 0})
            </h2>
            {(!vendor.quotations || vendor.quotations.length === 0) ? (
              <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0 }}>No quotations recorded for this vendor.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {vendor.quotations.map((q: any) => (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#F9FAFB', borderRadius: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{q.quotationNumber || `Quote #${q.id}`}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total: ₹{Number(q.totalAmount || 0).toLocaleString()} • Submitted {new Date(q.submittedAt || q.createdAt).toLocaleDateString()}</div>
                    </div>
                    <StatusBadge status={q.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status & Rating controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Management */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Vendor Approval Status
            </h2>
            <div className="form-group">
              <label>Status</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING_REVIEW">PENDING REVIEW</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="BLACKLISTED">BLACKLISTED</option>
              </select>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleUpdateStatus}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? 'Updating...' : 'Update Status'}
            </button>
          </div>

          {/* Category & Rating */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
              Category & Performance Rating
            </h2>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Services">Services</option>
                  <option value="Furniture">Furniture</option>
                </select>
              </div>

              <div className="form-group">
                <label>Rating (1.0 to 5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(parseFloat(e.target.value))}
                />
              </div>

              <button type="submit" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Save Changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
