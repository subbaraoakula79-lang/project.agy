import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Badge } from '../Badge';
import { Modal } from '../Modal';

export function PricingView() {
  const [pricingConfigs, setPricingConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [baseFare, setBaseFare] = useState<number>(0);
  const [perKmRate, setPerKmRate] = useState<number>(0);
  const [perMinRate, setPerMinRate] = useState<number>(0);
  const [minimumFare, setMinimumFare] = useState<number>(0);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.listPricing();
      setPricingConfigs(res.pricingConfigs);
    } catch (err: any) {
      setError(err.message || 'Failed to load pricing configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleOpenEdit = (config: any) => {
    setSelectedConfig(config);
    setBaseFare(config.baseFare);
    setPerKmRate(config.perKmRate);
    setPerMinRate(config.perMinRate);
    setMinimumFare(config.minimumFare);
    setEditModalOpen(true);
  };

  const handleUpdatePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfig) return;

    if (baseFare < 0 || perKmRate < 0 || perMinRate < 0 || minimumFare < 0) {
      setError('Fare rates cannot be negative');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      await api.updatePricing(selectedConfig.id, {
        baseFare: Number(baseFare),
        perKmRate: Number(perKmRate),
        perMinRate: Number(perMinRate),
        minimumFare: Number(minimumFare),
      });
      setEditModalOpen(false);
      setSuccess(`Pricing rule for ${selectedConfig.vehicleType?.name} updated successfully!`);
      await fetchPricing();
    } catch (err: any) {
      setError(err.message || 'Failed to update pricing');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>
          Pricing & Fare Rules Management
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: '#94A3B8', fontSize: '0.875rem' }}>
          Manage base fares, per-kilometer distances, and time rates per vehicle tier for Kakinada.
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

      {/* Pricing Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', gridColumn: '1 / -1' }}>
            Loading pricing rules...
          </div>
        ) : pricingConfigs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', gridColumn: '1 / -1' }}>
            No pricing configurations found.
          </div>
        ) : (
          pricingConfigs.map((config) => (
            <div
              key={config.id}
              style={{
                backgroundColor: '#111827',
                border: '1px solid #1E293B',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>
                      {config.vehicleType?.name === 'BIKE' ? '🏍️' : config.vehicleType?.name === 'AUTO' ? '🛺' : '🚕'}
                    </span>
                    <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC' }}>
                      {config.vehicleType?.displayName || config.vehicleType?.name}
                    </h2>
                  </div>
                  <Badge status={config.isActive ? 'ACTIVE' : 'INACTIVE'} type="boolean" />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem' }}>
                  City: {config.city?.name}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
                    <span>Base Fare:</span>
                    <strong style={{ color: '#F8FAFC' }}>₹{config.baseFare}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
                    <span>Per Kilometer Rate:</span>
                    <strong style={{ color: '#F8FAFC' }}>₹{config.perKmRate}/km</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
                    <span>Per Minute Rate:</span>
                    <strong style={{ color: '#F8FAFC' }}>₹{config.perMinRate}/min</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
                    <span>Minimum Fare:</span>
                    <strong style={{ color: '#F8FAFC' }}>₹{config.minimumFare}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenEdit(config)}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: '8px',
                  backgroundColor: '#334155',
                  color: '#F8FAFC',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                ✏️ Edit Rates
              </button>
            </div>
          ))
        )}
      </div>

      {/* Edit Pricing Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Pricing: ${selectedConfig?.vehicleType?.name}`}
        description="Update fare parameters. Changes take effect immediately and are logged to audit trail."
      >
        <form onSubmit={handleUpdatePricing} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.35rem' }}>
              Base Fare (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              required
              value={baseFare}
              onChange={(e) => setBaseFare(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '0.6rem',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#F8FAFC',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.35rem' }}>
              Per Km Rate (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              required
              value={perKmRate}
              onChange={(e) => setPerKmRate(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '0.6rem',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#F8FAFC',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.35rem' }}>
              Per Minute Rate (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              required
              value={perMinRate}
              onChange={(e) => setPerMinRate(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '0.6rem',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#F8FAFC',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.35rem' }}>
              Minimum Fare (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              required
              value={minimumFare}
              onChange={(e) => setMinimumFare(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '0.6rem',
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#F8FAFC',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#334155',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: '#4F46E5',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Save Rate Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
