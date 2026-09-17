import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Badge } from '../Badge';

export function VehiclesView() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchVehicles = async (p = page, q = search) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.listVehicles({
        page: p,
        limit: 15,
        search: q || undefined,
      });
      setVehicles(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles(page, search);
  }, [page]);

  const handleToggleActive = async (vehicleId: string, currentStatus: boolean) => {
    try {
      setActionLoading(true);
      setError('');
      await api.updateVehicle(vehicleId, { isActive: !currentStatus });
      setSuccess(`Vehicle status updated to ${!currentStatus ? 'Active' : 'Inactive'}`);
      await fetchVehicles();
    } catch (err: any) {
      setError(err.message || 'Failed to update vehicle');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVehicles(1, search);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>
            Vehicle Registry
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#94A3B8', fontSize: '0.875rem' }}>
            Inspect registered fleet vehicles, registration numbers, and operational status.
          </p>
        </div>
        <div style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>
          Total vehicles: <strong style={{ color: '#F1F5F9' }}>{total}</strong>
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#111827',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          border: '1px solid #1E293B',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search registration number or make..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              color: '#F1F5F9',
              fontSize: '0.85rem',
              outline: 'none',
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

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#F87171', borderRadius: '8px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399', borderRadius: '8px' }}>
          {success}
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
              <th style={{ padding: '1rem 1.25rem' }}>Registration Number</th>
              <th style={{ padding: '1rem 1.25rem' }}>Vehicle Type</th>
              <th style={{ padding: '1rem 1.25rem' }}>Make & Model</th>
              <th style={{ padding: '1rem 1.25rem' }}>Driver</th>
              <th style={{ padding: '1rem 1.25rem' }}>Status</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                  Loading vehicles...
                </td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                  No vehicles found.
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid #1E293B' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.9rem' }}>
                      {v.registrationNumber}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: 600 }}>
                      {v.vehicleType?.name || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                      {v.make} {v.model} ({v.year || 'N/A'})
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 600 }}>
                      {v.driverProfile?.user?.firstName} {v.driverProfile?.user?.lastName || ''}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {v.driverProfile?.user?.phoneNumber || 'N/A'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <Badge status={v.isActive ? 'ACTIVE' : 'INACTIVE'} type="boolean" />
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleToggleActive(v.id, v.isActive)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        backgroundColor: v.isActive ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                        color: v.isActive ? '#F87171' : '#34D399',
                        border: `1px solid ${v.isActive ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {v.isActive ? 'Deactivate' : 'Activate'}
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
