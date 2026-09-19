import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { Building2, Plus, Search, Filter, Star, Eye } from 'lucide-react';
import type { Vendor } from '../types';

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for adding vendor
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userName: '',
    password: '',
    companyName: '',
    category: 'Hardware',
    gstNumber: '',
    address: '',
    mobileNumber: '',
    rating: 4.5,
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, [search, category, status, page]);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (status) params.append('status', status);

      const res = await api.get(`/vendors?${params.toString()}`);
      setVendors(res.data?.data?.data || res.data?.data || []);
      setTotal(res.data?.data?.meta?.total || 0);
    } catch (err) {
      console.error('Failed to load vendors', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);
    try {
      await api.post('/vendors', formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        userName: '',
        password: '',
        companyName: '',
        category: 'Hardware',
        gstNumber: '',
        address: '',
        mobileNumber: '',
        rating: 4.5,
      });
      fetchVendors();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to register vendor');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Directory</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Manage approved suppliers, performance ratings, and vendor categories.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> Register Vendor
        </button>
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Search by vendor name, company, email, or code..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '2rem' }}
          />
        </div>

        <div style={{ width: '180px' }}>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Electronics">Electronics</option>
            <option value="Stationery">Stationery</option>
            <option value="Logistics">Logistics</option>
            <option value="Services">Services</option>
            <option value="Furniture">Furniture</option>
          </select>
        </div>

        <div style={{ width: '180px' }}>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING_REVIEW">PENDING REVIEW</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="BLACKLISTED">BLACKLISTED</option>
          </select>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Vendor & Company</th>
              <th>Vendor Code</th>
              <th>Category</th>
              <th>GST Number</th>
              <th>Rating</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  Loading vendors...
                </td>
              </tr>
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  No vendors found matching the criteria.
                </td>
              </tr>
            ) : (
              vendors.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#111827' }}>
                      {v.profile?.companyName || v.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      Contact: {v.name} ({v.email})
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>
                      {v.profile?.vendorCode || `VND-${v.id}`}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-purple">{v.profile?.category || 'General'}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>
                      {v.profile?.gstNumber || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#D97706', fontWeight: 600 }}>
                      <Star size={14} fill="#F59E0B" color="#F59E0B" />
                      <span>{v.profile?.rating ? Number(v.profile.rating).toFixed(1) : '4.5'}</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={v.profile?.status || 'ACTIVE'} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/vendors/${v.id}`} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}>
                      <Eye size={14} /> Profile
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Register Vendor Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: '#111827' }}>
              Onboard New Vendor
            </h2>

            {formError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateVendor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Contact Person Name *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Acme Tech Solutions"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vendor@company.com"
                  />
                </div>
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    required
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    placeholder="vendor_acme"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="form-group">
                  <label>Vendor Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Services">Services</option>
                    <option value="Furniture">Furniture</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>GST Number</label>
                  <input
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Registered company address"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Registering...' : 'Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
