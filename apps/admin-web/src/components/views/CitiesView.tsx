import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Badge } from '../Badge';

export function CitiesView() {
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCities = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.listCities();
      setCities(res.cities);
    } catch (err: any) {
      setError(err.message || 'Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleToggleCityActive = async (cityId: string, currentStatus: boolean) => {
    try {
      setActionLoading(true);
      setError('');
      await api.updateCity(cityId, { isActive: !currentStatus });
      setSuccess(`City service ${!currentStatus ? 'activated' : 'paused'} successfully!`);
      await fetchCities();
    } catch (err: any) {
      setError(err.message || 'Failed to update city status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>
          City Operations & Service Zones
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#94A3B8', fontSize: '0.875rem' }}>
          Configure operational service zones, service availability, and regional dispatch status.
        </p>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171', borderRadius: '8px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(16,185,129,0.15)', color: '#34D399', borderRadius: '8px' }}>
          {success}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
          Loading operational cities...
        </div>
      ) : cities.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
          No operational cities configured.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cities.map((city) => (
            <div
              key={city.id}
              style={{
                backgroundColor: '#111827',
                border: '1px solid #1E293B',
                borderRadius: '16px',
                padding: '1.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC' }}>
                    {city.name}
                  </h2>
                  <Badge status={city.isActive ? 'ACTIVE' : 'SUSPENDED'} type="boolean" />
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'flex', gap: '1.25rem' }}>
                  <span>State: {city.state}, {city.country}</span>
                  <span>Timezone: {city.timezone}</span>
                  <span>Coords: {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#CBD5E1', marginTop: '0.75rem' }}>
                  📊 <strong>{city._count?.driverProfiles ?? 0}</strong> drivers registered • <strong>{city._count?.rides ?? 0}</strong> trips fulfilled
                </div>
              </div>

              <div>
                <button
                  disabled={actionLoading}
                  onClick={() => handleToggleCityActive(city.id, city.isActive)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    backgroundColor: city.isActive ? 'rgba(239, 68, 68, 0.15)' : '#10B981',
                    color: city.isActive ? '#F87171' : '#FFFFFF',
                    border: city.isActive ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {city.isActive ? '⏸️ Pause Service in City' : '▶️ Activate Service'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
