import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Badge } from '../Badge';
import { Modal } from '../Modal';

interface RideDetailViewProps {
  rideId: string;
  onBack: () => void;
}

export function RideDetailView({ rideId, onBack }: RideDetailViewProps) {
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRide = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getRide(rideId);
      setRide(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load ride details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRide();
  }, [rideId]);

  const handleCancelRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setError('Please provide a cancellation reason');
      return;
    }
    try {
      setActionLoading(true);
      setError('');
      await api.cancelRide(rideId, cancelReason);
      setCancelModalOpen(false);
      setCancelReason('');
      setSuccess('Ride cancelled by admin successfully. Assigned driver freed.');
      await fetchRide();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel ride');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
        Loading ride details...
      </div>
    );
  }

  if (!ride) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Ride not found.</p>
        <button onClick={onBack} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Back to Rides
        </button>
      </div>
    );
  }

  const preRideStartedStates = [
    'REQUESTED',
    'SEARCHING_DRIVER',
    'DRIVER_ASSIGNED',
    'DRIVER_ARRIVING',
    'DRIVER_ARRIVED',
  ];
  const canAdminCancel = preRideStartedStates.includes(ride.status);
  const isInTransitOrSettled = [
    'RIDE_STARTED',
    'RIDE_IN_PROGRESS',
    'PAYMENT_PENDING',
    'PAYMENT_FAILED',
    'RIDE_COMPLETED',
    'COMPLETED',
  ].includes(ride.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          &larr; Back to Rides
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', borderRadius: '10px', color: '#FCA5A5' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid #10B981', borderRadius: '10px', color: '#6EE7B7' }}>
          {success}
        </div>
      )}

      {/* Header Card */}
      <div
        style={{
          backgroundColor: '#111827',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>
              Ride #{ride.id.substring(0, 10)}
            </h1>
            <Badge status={ride.status} type="ride" />
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '6px',
                backgroundColor: '#1E293B',
                color: '#CBD5E1',
              }}
            >
              {ride.vehicleTypeId}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.5rem' }}>
            Requested: {new Date(ride.requestedAt).toLocaleString()}
          </div>
          {ride.cancellationReason && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px', color: '#F87171', fontSize: '0.85rem' }}>
              <strong>Cancellation Reason:</strong> {ride.cancellationReason}
            </div>
          )}
        </div>

        {/* Safe Admin Intervention Controls */}
        <div>
          {canAdminCancel && (
            <button
              disabled={actionLoading}
              onClick={() => setCancelModalOpen(true)}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
              }}
            >
              ⚠️ Cancel Ride (Admin Override)
            </button>
          )}

          {isInTransitOrSettled && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontSize: '0.8rem',
                color: '#A5B4FC',
                maxWidth: '300px',
              }}
            >
              🔒 Trip in transit or settled. Admin cancellation locked to protect transit safety and financial integrity.
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Rider & Driver + Trip Lifecycle */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Parties Card */}
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1E293B',
            borderRadius: '16px',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Rider Details
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F1F5F9' }}>
              {ride.rider?.firstName} {ride.rider?.lastName || ''}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.2rem' }}>
              📞 {ride.rider?.phoneNumber || 'No phone'}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1E293B', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Assigned Driver
            </div>
            {ride.driverProfile?.user ? (
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#34D399' }}>
                  {ride.driverProfile.user.firstName} {ride.driverProfile.user.lastName || ''}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                  📞 {ride.driverProfile.user.phoneNumber || 'No phone'}
                </div>
                {ride.vehicle && (
                  <div style={{ fontSize: '0.85rem', color: '#CBD5E1', marginTop: '0.35rem' }}>
                    🚗 {ride.vehicle.registrationNumber} ({ride.vehicle.make} {ride.vehicle.model})
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.9rem', color: '#64748B', fontStyle: 'italic' }}>
                No driver assigned
              </div>
            )}
          </div>
        </div>

        {/* Lifecycle Timestamps */}
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid #1E293B',
            borderRadius: '16px',
            padding: '1.75rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>
            Trip Timeline
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
              <span>Requested:</span>
              <span>{ride.requestedAt ? new Date(ride.requestedAt).toLocaleTimeString() : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
              <span>Driver Accepted:</span>
              <span>{ride.acceptedAt ? new Date(ride.acceptedAt).toLocaleTimeString() : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
              <span>Driver Arrived:</span>
              <span>{ride.driverArrivedAt ? new Date(ride.driverArrivedAt).toLocaleTimeString() : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
              <span>Trip Started:</span>
              <span>{ride.startedAt ? new Date(ride.startedAt).toLocaleTimeString() : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
              <span>Trip Completed:</span>
              <span>{ride.completedAt ? new Date(ride.completedAt).toLocaleTimeString() : '—'}</span>
            </div>
            {ride.cancelledAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F87171', fontWeight: 600 }}>
                <span>Cancelled:</span>
                <span>{new Date(ride.cancelledAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Locations & Financials Card */}
      <div
        style={{
          backgroundColor: '#111827',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '1.75rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Route Coordinates & Addresses
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>PICKUP LOCATION</div>
            <div style={{ fontSize: '0.9rem', color: '#F1F5F9', marginTop: '0.2rem' }}>
              {ride.location?.pickupAddress || 'Address unavailable'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 700 }}>DROP LOCATION</div>
            <div style={{ fontSize: '0.9rem', color: '#F1F5F9', marginTop: '0.2rem' }}>
              {ride.location?.dropAddress || 'Address unavailable'}
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Fare & Payment Settlement
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
              <span>Estimated Fare:</span>
              <span>₹{ride.estimatedFare || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
              <span>Actual Fare:</span>
              <span style={{ fontWeight: 700, color: '#34D399' }}>₹{ride.actualFare || ride.estimatedFare || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
              <span>Payment Method:</span>
              <span style={{ fontWeight: 600 }}>{ride.paymentMethod}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1' }}>
              <span>Payment Status:</span>
              <span>
                <Badge status={ride.payment?.status || 'PENDING'} type="ride" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings & Reviews Card */}
      <div
        style={{
          backgroundColor: '#111827',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '1.75rem',
        }}
      >
        <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>
          ⭐ Persistent Ratings & Reviews Audit
        </div>

        {Array.isArray(ride.ratings) && ride.ratings.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {ride.ratings.map((r: any) => {
              const isRiderRater = r.raterUser?.role === 'RIDER';
              return (
                <div
                  key={r.id}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isRiderRater ? '#60A5FA' : '#34D399' }}>
                      {isRiderRater ? '👤 Rider -> Captain' : '🚖 Captain -> Rider'}
                    </span>
                    <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: '1.1rem' }}>
                      {'★'.repeat(r.rating)} ({r.rating}/5)
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#F1F5F9', marginBottom: '0.4rem' }}>
                    <strong>Rater:</strong> {r.raterUser?.firstName || 'User'} ({r.raterUser?.role || 'PARTICIPANT'})
                  </div>

                  {r.comment ? (
                    <div style={{ fontSize: '0.85rem', color: '#CBD5E1', fontStyle: 'italic', backgroundColor: '#0F172A', padding: '0.5rem', borderRadius: '6px', marginTop: '0.4rem' }}>
                      "{r.comment}"
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic', marginTop: '0.3rem' }}>
                      No text review provided
                    </div>
                  )}

                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
                    Submitted: {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic' }}>
            No ratings have been submitted for this ride yet.
          </div>
        )}
      </div>

      {/* Admin Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Admin Intervention: Cancel Ride"
        description="Provide a mandatory operational reason. This action is logged permanently to the append-only audit trail."
      >
        <form onSubmit={handleCancelRide}>
          <textarea
            required
            rows={4}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g. Extreme weather roadblock on Main Road, passenger assistance intervention..."
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '1rem',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setCancelModalOpen(false)}
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
                padding: '0.5rem 1rem',
                backgroundColor: '#EF4444',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Confirm Cancellation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
