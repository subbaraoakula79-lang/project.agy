import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Badge } from '../Badge';

interface RidesViewProps {
  onSelectRide: (rideId: string) => void;
}

export function RidesView({ onSelectRide }: RidesViewProps) {
  const [rides, setRides] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRides = async (p = page, s = statusFilter) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.listRides({
        page: p,
        limit: 15,
        status: s || undefined,
      });
      setRides(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides(page, statusFilter);
  }, [page, statusFilter]);

  const tabs = [
    { label: 'All Trips', value: '' },
    { label: 'Requested', value: 'REQUESTED' },
    { label: 'Driver Assigned', value: 'DRIVER_ASSIGNED' },
    { label: 'Driver Arrived', value: 'DRIVER_ARRIVED' },
    { label: 'In Progress', value: 'RIDE_STARTED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled by Admin', value: 'CANCELLED_BY_ADMIN' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>
            Live Rides & Trip Dispatch Monitoring
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#94A3B8', fontSize: '0.875rem' }}>
            Monitor trip state transitions, fares, and execute safe operational intervention.
          </p>
        </div>
        <div style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>
          Total trips: <strong style={{ color: '#F1F5F9' }}>{total}</strong>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          backgroundColor: '#111827',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          border: '1px solid #1E293B',
        }}
      >
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                backgroundColor: isActive ? '#4F46E5' : 'transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          backgroundColor: '#111827',
          border: '1px solid #1E293B',
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E293B', backgroundColor: '#0B1120', color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '1rem 1.25rem' }}>Ride ID / Time</th>
              <th style={{ padding: '1rem 1.25rem' }}>Rider</th>
              <th style={{ padding: '1rem 1.25rem' }}>Driver</th>
              <th style={{ padding: '1rem 1.25rem' }}>Status</th>
              <th style={{ padding: '1rem 1.25rem' }}>Fare</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                  Loading rides...
                </td>
              </tr>
            ) : rides.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                  No rides found.
                </td>
              </tr>
            ) : (
              rides.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #1E293B' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.85rem' }}>
                      #{r.id.substring(0, 8)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
                      {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, color: '#F1F5F9', fontSize: '0.875rem' }}>
                      {r.rider?.firstName} {r.rider?.lastName || ''}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {r.rider?.phoneNumber || 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {r.driverProfile?.user ? (
                      <div>
                        <div style={{ fontWeight: 600, color: '#34D399', fontSize: '0.875rem' }}>
                          {r.driverProfile.user.firstName} {r.driverProfile.user.lastName || ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {r.driverProfile.user.phoneNumber || 'N/A'}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <Badge status={r.status} type="ride" />
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F3F4F6' }}>
                      ₹{r.actualFare ?? r.estimatedFare ?? 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {r.paymentMethod}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => onSelectRide(r.id)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: '8px',
                        backgroundColor: '#4F46E5',
                        color: '#FFFFFF',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Details &rarr;
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              borderTop: '1px solid #1E293B',
              backgroundColor: '#0B1120',
              fontSize: '0.85rem',
              color: '#94A3B8',
            }}
          >
            <div>
              Page {page} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: '#1E293B',
                  color: page <= 1 ? '#475569' : '#E2E8F0',
                  border: '1px solid #334155',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: '#1E293B',
                  color: page >= totalPages ? '#475569' : '#E2E8F0',
                  border: '1px solid #334155',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
