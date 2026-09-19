import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Activity as ActivityIcon, Clock, Filter, Package, ShoppingCart, Receipt, CheckSquare, FileText } from 'lucide-react';
import type { Activity } from '../types';

export default function ActivityTimeline() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/rfqs?limit=10');
      const rfqs = res.data?.data?.data || res.data?.data || [];

      // Collect activities from recent RFQs
      const allActs: any[] = [];
      for (const rfq of rfqs.slice(0, 5)) {
        try {
          const aRes = await api.get(`/rfqs/${rfq.id}/activity`);
          const acts = aRes.data?.data || [];
          acts.forEach((a: any) => {
            allActs.push({ ...a, rfqTitle: rfq.title, rfqNumber: rfq.rfqNumber });
          });
        } catch (e) {}
      }

      allActs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setActivities(allActs);
    } catch (err) {
      console.error('Failed to load activity timeline', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (event: string) => {
    if (event.startsWith('RFQ_')) return <Package size={16} color="#3B82F6" />;
    if (event.startsWith('QUOTATION_')) return <FileText size={16} color="#F59E0B" />;
    if (event.startsWith('APPROVAL_')) return <CheckSquare size={16} color="#8B5CF6" />;
    if (event.startsWith('PO_')) return <ShoppingCart size={16} color="#10B981" />;
    if (event.startsWith('INVOICE_')) return <Receipt size={16} color="#EC4899" />;
    return <ActivityIcon size={16} color="#6B7280" />;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Procurement Activity Audit Log</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Chronological audit trail of all RFQ, quotation, approval, PO, and invoice events.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#6B7280', padding: '2rem' }}>Loading activity trail...</p>
        ) : activities.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6B7280', padding: '2rem' }}>No activity records found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
            {activities.map((act) => (
              <div key={act.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getEventIcon(act.event)}
                </div>

                <div style={{ flex: 1, background: '#F9FAFB', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
                      {act.event.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#374151' }}>
                    {act.description}
                  </p>

                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem' }}>
                    Context: <Link to={`/rfqs/${act.rfqId}`} style={{ color: '#1E3A8A', fontWeight: 600 }}>{(act as any).rfqNumber || `RFQ #${act.rfqId}`} — {(act as any).rfqTitle}</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
