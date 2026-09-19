import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeft, Check, X, ShieldCheck, AlertCircle, Building2, Package, FileText } from 'lucide-react';

export default function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [approval, setApproval] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [comment, setComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApproval();
  }, [id]);

  const fetchApproval = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/approvals/${id}`);
      setApproval(res.data?.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load approval request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this shortlisted quotation?')) return;
    setIsProcessing(true);
    setError('');
    try {
      await api.post(`/approvals/${id}/approve`, { comment: comment || undefined });
      setMessage('Quotation approved successfully! Procurement Officer can now issue the Purchase Order.');
      fetchApproval();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve quotation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setRejectError('Rejection comments/remarks are mandatory');
      return;
    }

    setIsProcessing(true);
    setRejectError('');
    try {
      await api.post(`/approvals/${id}/reject`, { comment: rejectReason.trim() });
      setShowRejectModal(false);
      setMessage('Quotation has been rejected and returned for revision.');
      fetchApproval();
    } catch (err: any) {
      setRejectError(err.response?.data?.message || 'Failed to reject quotation');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading approval details...</div>;
  }

  if (error || !approval) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{error || 'Approval request not found.'}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/approvals')}>
          <ArrowLeft size={16} /> Back to Approvals
        </button>
      </div>
    );
  }

  const isPending = approval.status === 'PENDING';
  const canDecide = (user?.role === 'MANAGER' || user?.role === 'ADMIN') && isPending;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/approvals')} style={{ marginBottom: '0.75rem' }}>
          <ArrowLeft size={16} /> Back to Approvals
        </button>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 className="page-title">Approval Request #{approval.id}</h1>
              <StatusBadge status={approval.status} />
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Requested by {approval.requestedBy?.name} on {new Date(approval.requestedAt).toLocaleString()}
            </p>
          </div>

          {canDecide && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-danger"
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessing}
              >
                <X size={16} /> Reject Quotation
              </button>
              <button
                className="btn btn-success"
                onClick={handleApprove}
                disabled={isProcessing}
              >
                <Check size={16} /> Approve Quotation
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {message}
        </div>
      )}

      {approval.comment && (
        <div style={{
          background: approval.status === 'APPROVED' ? '#EFF6FF' : '#FEF2F2',
          border: `1px solid ${approval.status === 'APPROVED' ? '#BFDBFE' : '#FECACA'}`,
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827', marginBottom: '0.25rem' }}>
            Decision Comments ({approval.decidedBy?.name || 'Manager'}):
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151' }}>{approval.comment}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: RFQ & Quotation Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quotation Line Items */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, color: '#111827' }}>
                Proposed Quotation Items ({approval.quotation?.items?.length || 0})
              </div>
              <span style={{ fontWeight: 700, color: '#1E3A8A' }}>
                Total: ₹{Number(approval.quotation?.totalAmount || 0).toLocaleString()}
              </span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Tax</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {approval.quotation?.items?.map((item: any) => (
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

          {/* Optional Approve Comment Box */}
          {canDecide && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                Approval Notes (Optional)
              </h2>
              <textarea
                rows={2}
                placeholder="Add any authorization notes, payment schedule conditions, or remarks..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Right Column: Context Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Supplier Info */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
              Shortlisted Supplier
            </h2>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              {approval.quotation?.vendor?.profile?.companyName || approval.quotation?.vendor?.name}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem' }}>
              Lead Time: <span style={{ fontWeight: 600, color: '#111827' }}>{approval.quotation?.deliveryDays || 'N/A'} Days</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem' }}>
              Payment Terms: <span style={{ fontWeight: 600, color: '#111827' }}>{approval.quotation?.paymentTerms || 'Standard'}</span>
            </div>
          </div>

          {/* RFQ Context */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
              Associated RFQ
            </h2>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{approval.rfq?.title}</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6B7280', marginTop: '0.2rem' }}>
              {approval.rfq?.rfqNumber}
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <Link to={`/rfqs/${approval.rfqId}/compare`} className="btn btn-secondary" style={{ fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}>
                View All Competing Bids
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Rejection Reason Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#DC2626', marginBottom: '0.5rem' }}>
              Reject Quotation
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', marginBottom: '1rem' }}>
              Please provide mandatory remarks or justification for rejecting this shortlisted quote.
            </p>

            {rejectError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
                {rejectError}
              </div>
            )}

            <form onSubmit={handleReject}>
              <div className="form-group">
                <label>Rejection Remarks *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="State the reason for rejection (e.g. Budget ceiling exceeded, lead time unacceptable, higher than historical cost)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={isProcessing}>
                  {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
