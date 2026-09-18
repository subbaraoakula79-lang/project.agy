'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export function IncidentsView() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/incidents');
      setIncidents(res.data || []);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/incidents/${id}/status`, { status: newStatus });
      fetchIncidents();
    } catch (err) {
      alert('Failed to update incident status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateSeverity = async (id: string, newSeverity: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/incidents/${id}/severity`, { severity: newSeverity });
      fetchIncidents();
    } catch (err) {
      alert('Failed to update incident severity');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ padding: '1.5rem', color: '#F8FAFC' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#F59E0B' }}>
        ⚠️ Safety & Behavior Incident Logs
      </h2>
      <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Audit and triage incidents reported across Kakinada rides. Update severity or initiate review.
      </p>

      {loading ? (
        <div>Loading incident logs...</div>
      ) : incidents.length === 0 ? (
        <div style={{ backgroundColor: '#0F172A', padding: '2rem', borderRadius: '12px', border: '1px solid #1E293B', textAlign: 'center', color: '#94A3B8' }}>
          No incidents logged.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {incidents.map((inc) => (
            <div
              key={inc.id}
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
                      backgroundColor: inc.severity === 'CRITICAL' || inc.severity === 'HIGH' ? '#7F1D1D' : '#334155',
                      color: inc.severity === 'CRITICAL' || inc.severity === 'HIGH' ? '#FCA5A5' : '#E2E8F0',
                    }}
                  >
                    SEVERITY: {inc.severity}
                  </span>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: '#1E3A8A',
                      color: '#93C5FD',
                    }}
                  >
                    {inc.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Status: {inc.status}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#F8FAFC', marginBottom: '0.3rem' }}>
                  {inc.description}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Ride #{inc.rideId?.substring(0, 8)} | Reported: {new Date(inc.createdAt).toLocaleString()} | By: {inc.reportedByUser?.firstName || inc.reportedByUserId}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  value={inc.severity}
                  onChange={(e) => handleUpdateSeverity(inc.id, e.target.value)}
                  disabled={updatingId === inc.id}
                  style={{
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '0.4rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>

                {inc.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateStatus(inc.id, 'RESOLVED')}
                    disabled={updatingId === inc.id}
                    style={{
                      backgroundColor: '#16A34A',
                      color: '#FFF',
                      border: 'none',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Resolve
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
