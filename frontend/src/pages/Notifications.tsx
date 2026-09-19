import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react';
import type { Notification } from '../types';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/notifications?limit=50');
      setNotifications(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications Center</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            System updates, RFQ invites, quote submissions, approval alerts, and PO notices.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button className="btn btn-secondary" onClick={handleMarkAllAsRead}>
            <CheckCheck size={16} /> Mark All as Read
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        {isLoading ? (
          <p style={{ textAlign: 'center', color: '#6B7280', padding: '2rem' }}>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6B7280', padding: '2rem' }}>No notifications found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: notif.isRead ? '#FFFFFF' : '#EFF6FF',
                  border: `1px solid ${notif.isRead ? '#E5E7EB' : '#BFDBFE'}`,
                  borderRadius: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: notif.isRead ? '#9CA3AF' : '#3B82F6',
                    marginTop: 6,
                    flexShrink: 0
                  }} />
                  <div>
                    <div style={{ fontWeight: notif.isRead ? 500 : 700, fontSize: '0.9rem', color: '#111827' }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#4B5563', marginTop: '0.2rem' }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '0.35rem' }}>
                      {new Date(notif.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {notif.link && (
                    <Link
                      to={notif.link}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                      onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                    >
                      <ExternalLink size={14} /> Open
                    </Link>
                  )}
                  {!notif.isRead && (
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                      onClick={() => handleMarkAsRead(notif.id)}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
