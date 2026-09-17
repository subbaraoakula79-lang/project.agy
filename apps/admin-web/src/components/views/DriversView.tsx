import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Badge } from '../Badge';

interface DriversViewProps {
  onSelectDriver: (driverId: string) => void;
}

export function DriversView({ onSelectDriver }: DriversViewProps) {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDrivers = async (p = page, s = statusFilter, q = search) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.listDrivers({
        page: p,
        limit: 15,
        verificationStatus: s || undefined,
        search: q || undefined,
      });
      setDrivers(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers(page, statusFilter, search);
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDrivers(1, statusFilter, search);
  };

  const tabs = [
    { label: 'All Drivers', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Suspended', value: 'SUSPENDED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>
            Driver Management & Onboarding
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#94A3B8', fontSize: '0.875rem' }}>
            Verify driver credentials, manage fleet availability, and issue administrative actions.
          </p>
        </div>
        <div style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>
          Total drivers: <strong style={{ color: '#F1F5F9' }}>{total}</strong>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#111827',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          border: '1px solid #1E293B',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              color: '#F1F5F9',
              fontSize: '0.85rem',
              outline: 'none',
              minWidth: '220px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#334155',
              color: '#F8FAFC',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Error state */}
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
              <th style={{ padding: '1rem 1.25rem' }}>Driver</th>
              <th style={{ padding: '1rem 1.25rem' }}>Verification</th>
              <th style={{ padding: '1rem 1.25rem' }}>Fleet Status</th>
              <th style={{ padding: '1rem 1.25rem' }}>Vehicle</th>
              <th style={{ padding: '1rem 1.25rem' }}>Stats</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                  Loading drivers...
                </td>
              </tr>
            ) : drivers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                  No drivers found matching criteria.
                </td>
              </tr>
            ) : (
              drivers.map((d) => {
                const vehicle = d.vehicles?.[0];
                return (
                  <tr
                    key={d.id}
                    style={{ borderBottom: '1px solid #1E293B', transition: 'background 0.15s ease' }}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: '#F1F5F9', fontSize: '0.9rem' }}>
                        {d.user?.firstName} {d.user?.lastName || ''}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                        {d.user?.phoneNumber || d.user?.email || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <Badge status={d.verificationStatus} type="driver" />
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <Badge status={d.status} type="driver" />
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {vehicle ? (
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>
                            {vehicle.registrationNumber}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            {vehicle.vehicleType?.name || 'N/A'} • {vehicle.make} {vehicle.model}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#64748B' }}>No Vehicle</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontSize: '0.85rem', color: '#E2E8F0' }}>
                        {d.totalRides} rides
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#FBBF24' }}>
                        ★ {d.averageRating?.toFixed(1) || '0.0'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => onSelectDriver(d.id)}
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
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
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
              Page {page} of {totalPages} ({total} items)
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
