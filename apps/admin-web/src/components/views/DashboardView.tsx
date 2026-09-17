import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Badge } from '../Badge';

interface DashboardViewProps {
  onNavigate: (tab: string, id?: string) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <div>Loading operational metrics for Kakinada...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          color: '#F87171',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Failed to load dashboard</div>
        <div>{error}</div>
        <button
          onClick={fetchStats}
          style={{
            marginTop: '1rem',
            padding: '0.4rem 1rem',
            backgroundColor: '#EF4444',
            color: '#FFF',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { drivers, rides, vehicles, recentAuditLogs, recentRides } = stats || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
          padding: '2rem',
          borderRadius: '16px',
          border: '1px solid #312E81',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#F8FAFC' }}>
            Kakinada Service Control
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#94A3B8', fontSize: '0.95rem' }}>
            Real-time fleet monitoring, driver verification pipeline & dispatch management.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => onNavigate('drivers')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              backgroundColor: '#4F46E5',
              color: '#FFF',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
            }}
          >
            <span>Review Drivers</span>
            {drivers?.pending > 0 && (
              <span
                style={{
                  backgroundColor: '#EF4444',
                  borderRadius: '9999px',
                  padding: '0.1rem 0.45rem',
                  fontSize: '0.75rem',
                }}
              >
                {drivers.pending}
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigate('rides')}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              backgroundColor: '#1E293B',
              color: '#E2E8F0',
              border: '1px solid #334155',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Live Rides Feed
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Card 1: Verification Queue */}
        <div
          onClick={() => onNavigate('drivers')}
          style={{
            backgroundColor: '#131D33',
            border: '1px solid #1E293B',
            borderRadius: '14px',
            padding: '1.5rem',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, border-color 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>VERIFICATION QUEUE</span>
            <span style={{ fontSize: '1.25rem' }}>📋</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: drivers?.pending > 0 ? '#FBBF24' : '#10B981' }}>
            {drivers?.pending ?? 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
            {drivers?.underReview ?? 0} in review • {drivers?.approved ?? 0} approved
          </div>
        </div>

        {/* Card 2: Active Fleet */}
        <div
          onClick={() => onNavigate('drivers')}
          style={{
            backgroundColor: '#131D33',
            border: '1px solid #1E293B',
            borderRadius: '14px',
            padding: '1.5rem',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>ONLINE FLEET</span>
            <span style={{ fontSize: '1.25rem' }}>🚖</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34D399' }}>
            {drivers?.online ?? 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
            {vehicles?.active ?? 0} vehicles ready in Kakinada
          </div>
        </div>

        {/* Card 3: Active Rides */}
        <div
          onClick={() => onNavigate('rides')}
          style={{
            backgroundColor: '#131D33',
            border: '1px solid #1E293B',
            borderRadius: '14px',
            padding: '1.5rem',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>ACTIVE TRIPS</span>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#818CF8' }}>
            {rides?.active ?? 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
            {rides?.today ?? 0} total trips requested today
          </div>
        </div>

        {/* Card 4: Gross Completed Value */}
        <div
          style={{
            backgroundColor: '#131D33',
            border: '1px solid #1E293B',
            borderRadius: '14px',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600 }}>GROSS VOLUME</span>
            <span style={{ fontSize: '1.25rem' }}>₹</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F3F4F6' }}>
            ₹{Math.round(rides?.totalGrossFare ?? 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
            {rides?.completed ?? 0} completed • {rides?.cancelled ?? 0} cancelled
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Recent Rides + Recent Audit Trail */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Rides */}
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1E293B',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F1F5F9' }}>
              Live Trip Stream
            </h2>
            <button
              onClick={() => onNavigate('rides')}
              style={{
                background: 'none',
                border: 'none',
                color: '#6366F1',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View All &rarr;
            </button>
          </div>

          {!recentRides || recentRides.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.9rem' }}>
              No recent rides found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentRides.map((r: any) => (
                <div
                  key={r.id}
                  onClick={() => onNavigate('ride-detail', r.id)}
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: '#1E293B',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#F8FAFC' }}>
                      {r.rider?.firstName || 'Rider'} {r.rider?.lastName || ''}
                      <span style={{ color: '#64748B', fontWeight: 400, marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                        ({r.vehicleTypeId})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                      Driver: {r.driverProfile?.user ? `${r.driverProfile.user.firstName} ${r.driverProfile.user.lastName || ''}` : 'Unassigned'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge status={r.status} type="ride" />
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                      ₹{r.actualFare ?? r.estimatedFare ?? 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Audit Logs */}
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1E293B',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F1F5F9' }}>
              Operations Audit Trail
            </h2>
            <button
              onClick={() => onNavigate('audit-logs')}
              style={{
                background: 'none',
                border: 'none',
                color: '#6366F1',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View All &rarr;
            </button>
          </div>

          {!recentAuditLogs || recentAuditLogs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.9rem' }}>
              No audit records logged yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentAuditLogs.map((log: any) => (
                <div
                  key={log.id}
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: '#1E293B',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#A5B4FC',
                          letterSpacing: '0.025em',
                        }}
                      >
                        {log.action}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                        [{log.entityType}]
                      </span>
                    </div>
                    {log.reason && (
                      <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '0.2rem' }}>
                        {log.reason}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
