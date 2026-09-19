import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeft, Check, Award, Zap, DollarSign, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

export default function QuotationCompare() {
  const { rfqId } = useParams<{ rfqId: string }>();
  const navigate = useNavigate();

  const [compareData, setCompareData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComparison();
  }, [rfqId]);

  const fetchComparison = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/rfqs/${rfqId}/compare`);
      setCompareData(res.data?.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load quotation comparison');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShortlist = async (quotationId: number) => {
    if (!confirm('Are you sure you want to shortlist this quotation and submit it to Finance Manager for approval?')) {
      return;
    }
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      await api.post(`/rfqs/${rfqId}/shortlist`, { quotationId });
      setMessage('Quotation shortlisted successfully! Approval request has been sent to Finance Managers.');
      fetchComparison();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to shortlist quotation');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading side-by-side comparison...</div>;
  }

  if (error || !compareData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
          <AlertCircle size={20} style={{ margin: '0 auto 0.5rem' }} />
          <p>{error || 'No comparison data available for this RFQ.'}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(`/rfqs/${rfqId}`)}>
          <ArrowLeft size={16} /> Back to RFQ
        </button>
      </div>
    );
  }

  const { rfq, quotations, summary } = compareData;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate(`/rfqs/${rfqId}`)} style={{ marginBottom: '0.75rem' }}>
          <ArrowLeft size={16} /> Back to RFQ
        </button>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <h1 className="page-title">Quotation Comparison Matrix</h1>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Side-by-side evaluation for RFQ: <span style={{ fontWeight: 600, color: '#111827' }}>{rfq.rfqNumber} — {rfq.title}</span>
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {message}
        </div>
      )}

      {/* Summary Metrics Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10B981', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Lowest Total Bid</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#059669' }}>
              {summary.lowestTotalAmount ? `₹${Number(summary.lowestTotalAmount).toLocaleString()}` : 'N/A'}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Fastest Delivery</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#2563EB' }}>
              {summary.fastestDeliveryDays !== null ? `${summary.fastestDeliveryDays} Days` : 'N/A'}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #8B5CF6', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>Total Bids Received</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#7C3AED' }}>
              {summary.totalQuotations} Submissions
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix Table */}
      <div className="card" style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table className="table" style={{ minWidth: '800px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              <th style={{ width: '220px', position: 'sticky', left: 0, background: '#F9FAFB', zIndex: 1 }}>
                Evaluation Criteria
              </th>
              {quotations.map((q: any) => {
                const isLowestTotal = q.id === summary.lowestTotalQuoteId;
                return (
                  <th
                    key={q.id}
                    style={{
                      minWidth: '220px',
                      background: isLowestTotal ? '#F0FDF4' : undefined,
                      borderLeft: isLowestTotal ? '2px solid #10B981' : undefined,
                      borderRight: isLowestTotal ? '2px solid #10B981' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#111827' }}>
                        {q.vendor?.profile?.companyName || q.vendor?.name}
                      </span>
                      {isLowestTotal && (
                        <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Lowest Bid</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '0.2rem', textTransform: 'none' }}>
                      Quote: {q.quotationNumber || `QT-${q.id}`}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Status Row */}
            <tr>
              <td style={{ fontWeight: 600, color: '#4B5563', position: 'sticky', left: 0, background: 'white' }}>
                Status
              </td>
              {quotations.map((q: any) => (
                <td key={q.id} style={{ background: q.id === summary.lowestTotalQuoteId ? '#F0FDF4' : undefined }}>
                  <StatusBadge status={q.status} />
                </td>
              ))}
            </tr>

            {/* Total Quotation Amount */}
            <tr style={{ background: '#F9FAFB' }}>
              <td style={{ fontWeight: 700, color: '#111827', position: 'sticky', left: 0, background: '#F9FAFB' }}>
                Total Quoted Amount
              </td>
              {quotations.map((q: any) => {
                const isLowest = q.id === summary.lowestTotalQuoteId;
                return (
                  <td
                    key={q.id}
                    style={{
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      color: isLowest ? '#059669' : '#111827',
                      background: isLowest ? '#DCFCE7' : undefined,
                    }}
                  >
                    ₹{Number(q.totalAmount).toLocaleString()}
                    <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 'normal' }}>
                      Subtotal: ₹{Number(q.subtotal || q.totalAmount).toLocaleString()} • Tax: ₹{Number(q.tax || 0).toLocaleString()}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Delivery Timeline */}
            <tr>
              <td style={{ fontWeight: 600, color: '#4B5563', position: 'sticky', left: 0, background: 'white' }}>
                Lead Time / Delivery Days
              </td>
              {quotations.map((q: any) => {
                const isFastest = q.id === summary.fastestDeliveryQuoteId;
                return (
                  <td key={q.id} style={{ background: q.id === summary.lowestTotalQuoteId ? '#F0FDF4' : undefined }}>
                    <span style={{ fontWeight: isFastest ? 700 : 500, color: isFastest ? '#2563EB' : '#111827' }}>
                      {q.deliveryDays ? `${q.deliveryDays} Days` : 'Not specified'}
                    </span>
                    {isFastest && <span className="badge badge-blue" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>Fastest</span>}
                  </td>
                );
              })}
            </tr>

            {/* Payment Terms */}
            <tr>
              <td style={{ fontWeight: 600, color: '#4B5563', position: 'sticky', left: 0, background: 'white' }}>
                Payment Terms
              </td>
              {quotations.map((q: any) => (
                <td key={q.id} style={{ background: q.id === summary.lowestTotalQuoteId ? '#F0FDF4' : undefined, fontSize: '0.85rem' }}>
                  {q.paymentTerms || 'Standard (Net 30)'}
                </td>
              ))}
            </tr>

            {/* Itemized Breakdown Section Header */}
            <tr style={{ background: '#E5E7EB' }}>
              <td colSpan={quotations.length + 1} style={{ fontWeight: 700, color: '#1E3A8A', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Itemized Unit Pricing Comparison
              </td>
            </tr>

            {/* Item Rows */}
            {rfq.items?.map((item: any) => {
              const itemComp = summary.itemComparisons?.find((ic: any) => ic.rfqItemId === item.id);
              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, position: 'sticky', left: 0, background: 'white' }}>
                    <div>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      Qty: {item.quantity} {item.unit || 'Units'}
                    </div>
                  </td>
                  {quotations.map((q: any) => {
                    const matchedItem = q.items?.find((qi: any) => qi.rfqItemId === item.id || qi.name === item.name);
                    const unitPrice = matchedItem ? Number(matchedItem.unitPrice) : null;
                    const isLowestUnit = unitPrice !== null && itemComp?.lowestUnitPrice === unitPrice;

                    return (
                      <td
                        key={q.id}
                        style={{
                          background: isLowestUnit ? '#F0FDF4' : (q.id === summary.lowestTotalQuoteId ? '#F0FDF4' : undefined),
                        }}
                      >
                        {unitPrice !== null ? (
                          <div>
                            <div style={{ fontWeight: isLowestUnit ? 700 : 500, color: isLowestUnit ? '#059669' : '#111827' }}>
                              ₹{unitPrice.toLocaleString()} / unit
                              {isLowestUnit && (
                                <span style={{ marginLeft: '0.35rem', color: '#059669', fontSize: '0.75rem' }}>★</span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                              Line Total: ₹{(unitPrice * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#9CA3AF' }}>Not Quoted</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Action Row */}
            <tr style={{ background: '#F9FAFB' }}>
              <td style={{ fontWeight: 700, position: 'sticky', left: 0, background: '#F9FAFB' }}>
                Procurement Action
              </td>
              {quotations.map((q: any) => (
                <td key={q.id} style={{ background: q.id === summary.lowestTotalQuoteId ? '#F0FDF4' : undefined }}>
                  {q.status === 'SUBMITTED' ? (
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}
                      onClick={() => handleShortlist(q.id)}
                      disabled={actionLoading}
                    >
                      <Check size={14} /> Shortlist & Approve
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#6B7280', fontStyle: 'italic' }}>
                      {q.status === 'SHORTLISTED' ? 'Pending Approval' : q.status}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
