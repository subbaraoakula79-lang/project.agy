'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export function SafetyView() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/safety/events');
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to fetch safety events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await api.patch(`/admin/safety/sos/${id}/resolve`, { reason: 'Resolved by Admin Control' });
      fetchEvents();
    } catch (err) {
      alert('Failed to resolve safety event');
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div style={{ padding: '1.5rem', color: '#F8FAFC' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#EF4444' }}>
        🚨 Emergency Safety Interventions (SOS Control)
      </h2>
      <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Monitor and resolve high-priority emergency alerts triggered by riders and captains.
      </p>

      {loading ? (
        <div>Loading safety events...</div>
      ) : events.length === 0 ? (
        <div style={{ backgroundColor: '#0F172A', padding: '2rem', borderRadius: '12px', border: '1px solid #1E293B', textAlign: 'center', color: '#94A3B8' }}>
          No active emergency SOS events currently active.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {events.map((ev) => (
            <div
              key={ev.id}
              style={{
                backgroundColor: '#1E293B',
                border: ev.status === 'ACTIVE' ? '1px solid #EF4444' : '1px solid #334155',
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
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: ev.status === 'ACTIVE' ? '#7F1D1D' : '#14532D',
                      color: ev.status === 'ACTIVE' ? '#FCA5A5' : '#86EFAC',
                    }}
                  >
                    {ev.status}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>
                    Ride #{ev.rideId?.substring(0, 8)}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#F8FAFC', marginBottom: '0.25rem' }}>
                  {ev.description || 'Emergency SOS Triggered'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Reported: {new Date(ev.createdAt).toLocaleString()} | Reported By: {ev.reportedByUser?.firstName || ev.reportedByUserId}
                </div>
              </div>

              {ev.status === 'ACTIVE' && (
                <button
                  onClick={() => handleResolve(ev.id)}
                  disabled={resolvingId === ev.id}
                  style={{
                    backgroundColor: '#DC2626',
                    color: '#FFF',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {resolvingId === ev.id ? 'Resolving...' : 'Resolve Intervention'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
