import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export function AuditLogsView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async (p = page, a = actionFilter) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.listAuditLogs({
        page: p,
        limit: 20,
        action: a || undefined,
      });
      setLogs(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, actionFilter);
  }, [page, actionFilter]);

  const actions = [
    { label: 'All Actions', value: '' },
    { label: 'Driver Approved', value: 'DRIVER_APPROVED' },
    { label: 'Driver Rejected', value: 'DRIVER_REJECTED' },
    { label: 'Driver Suspended', value: 'DRIVER_SUSPENDED' },
    { label: 'Document Approved', value: 'DOCUMENT_APPROVED' },
    { label: 'Document Rejected', value: 'DOCUMENT_REJECTED' },
    { label: 'Ride Cancelled', value: 'RIDE_CANCELLED' },
    { label: 'Pricing Updated', value: 'PRICING_UPDATED' },
    { label: 'City Updated', value: 'CITY_UPDATED' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>
            Append-Only Audit Trail
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#94A3B8', fontSize: '0.875rem' }}>
            Immutable administrative action logs with operator accountability and timestamping.
          </p>
        </div>
        <div style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>
          Total logged events: <strong style={{ color: '#F1F5F9' }}>{total}</strong>
        </div>
      </div>

      {/* Filter Tabs */}
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
        {actions.map((act) => {
          const isActive = actionFilter === act.value;
          return (
            <button
              key={act.value}
              onClick={() => {
                setActionFilter(act.value);
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
              {act.label}
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
              <th style={{ padding: '1rem 1.25rem' }}>Timestamp</th>
              <th style={{ padding: '1rem 1.25rem' }}>Action</th>
              <th style={{ padding: '1rem 1.25rem' }}>Target Entity</th>
              <th style={{ padding: '1rem 1.25rem' }}>Operator ID</th>
              <th style={{ padding: '1rem 1.25rem' }}>Reason & Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                  Loading audit trail...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                  No audit log entries recorded.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #1E293B' }}>
                  <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 600 }}>
                      {new Date(log.createdAt).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        color: '#A5B4FC',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#E2E8F0', fontWeight: 600 }}>
                      {log.entityType}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      ID: #{log.entityId?.substring(0, 8)}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                      {log.adminUserId?.substring(0, 12)}...
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: '#F1F5F9' }}>
                      {log.reason || 'No reason provided'}
                    </div>
                    {log.metadata && (
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
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
