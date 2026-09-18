'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export function SupportTicketsView() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/support/tickets');
      setTickets(res.data || []);
    } catch (err) {
      console.error('Failed to fetch support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/support/tickets/${id}/status`, { status: newStatus });
      fetchTickets();
    } catch (err) {
      alert('Failed to update ticket status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ padding: '1.5rem', color: '#F8FAFC' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#38BDF8' }}>
        💬 Customer & Captain Support Desk
      </h2>
      <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Track, manage, and resolve inquiries and service requests from riders and drivers.
      </p>

      {loading ? (
        <div>Loading support tickets...</div>
      ) : tickets.length === 0 ? (
        <div style={{ backgroundColor: '#0F172A', padding: '2rem', borderRadius: '12px', border: '1px solid #1E293B', textAlign: 'center', color: '#94A3B8' }}>
          No support tickets currently filed.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {tickets.map((t) => (
            <div
              key={t.id}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: t.status === 'RESOLVED' ? '#14532D' : '#1E3A8A',
                      color: t.status === 'RESOLVED' ? '#86EFAC' : '#93C5FD',
                    }}
                  >
                    {t.status}
                  </span>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: '#334155',
                      color: '#F1F5F9',
                    }}
                  >
                    {t.category}
                  </span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.25rem' }}>
                  {t.subject}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#CBD5E1', marginBottom: '0.4rem' }}>
                  {t.description}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Created: {new Date(t.createdAt).toLocaleString()} | By: {t.createdByUser?.firstName || t.createdByUserId}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {t.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'RESOLVED')}
                    disabled={updatingId === t.id}
                    style={{
                      backgroundColor: '#16A34A',
                      color: '#FFF',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Mark Resolved
                  </button>
                )}
                {t.status !== 'CLOSED' && (
                  <button
                    onClick={() => handleUpdateStatus(t.id, 'CLOSED')}
                    disabled={updatingId === t.id}
                    style={{
                      backgroundColor: '#475569',
                      color: '#FFF',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
