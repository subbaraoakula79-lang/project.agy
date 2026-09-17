import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Badge } from '../Badge';
import { Modal } from '../Modal';

interface DriverDetailViewProps {
  driverId: string;
  onBack: () => void;
}

export function DriverDetailView({ driverId, onBack }: DriverDetailViewProps) {
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  const [rejectDocModalOpen, setRejectDocModalOpen] = useState(false);
  const [rejectDocId, setRejectDocId] = useState('');
  const [rejectDocReason, setRejectDocReason] = useState('');

  const fetchDriver = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getDriver(driverId);
      setDriver(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load driver detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriver();
  }, [driverId]);

  const handleApproveDriver = async () => {
    try {
      setActionLoading(true);
      setError('');
      await api.approveDriver(driverId);
      setSuccessMessage('Driver approved successfully! Driver is now eligible to go online.');
      await fetchDriver();
    } catch (err: any) {
      setError(err.message || 'Failed to approve driver');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    try {
      setActionLoading(true);
      setError('');
      await api.rejectDriver(driverId, rejectReason);
      setRejectModalOpen(false);
      setRejectReason('');
      setSuccessMessage('Driver onboarding application rejected.');
      await fetchDriver();
    } catch (err: any) {
      setError(err.message || 'Failed to reject driver');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendReason.trim()) {
      setError('Please provide a suspension reason');
      return;
    }
    try {
      setActionLoading(true);
      setError('');
      await api.suspendDriver(driverId, suspendReason);
      setSuspendModalOpen(false);
      setSuspendReason('');
      setSuccessMessage('Driver suspended. Active rides preserved, but driver is blocked from going online.');
      await fetchDriver();
    } catch (err: any) {
      setError(err.message || 'Failed to suspend driver');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateDriver = async () => {
    try {
      setActionLoading(true);
      setError('');
      await api.reactivateDriver(driverId);
      setSuccessMessage('Driver reactivated.');
      await fetchDriver();
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate driver');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveDoc = async (docId: string) => {
    try {
      setActionLoading(true);
      setError('');
      await api.approveDocument(driverId, docId);
      setSuccessMessage('Document verified.');
      await fetchDriver();
    } catch (err: any) {
      setError(err.message || 'Failed to approve document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectDocReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    try {
      setActionLoading(true);
      setError('');
      await api.rejectDocument(driverId, rejectDocId, rejectDocReason);
      setRejectDocModalOpen(false);
      setRejectDocId('');
      setRejectDocReason('');
      setSuccessMessage('Document rejected.');
      await fetchDriver();
    } catch (err: any) {
      setError(err.message || 'Failed to reject document');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
        Loading driver profile...
      </div>
    );
  }

  if (!driver) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Driver profile not found.</p>
        <button onClick={onBack} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Back to Drivers
        </button>
      </div>
    );
  }

  const documents = driver.documents || [];
  const requiredTypes = ['DRIVING_LICENSE', 'VEHICLE_RC', 'VEHICLE_INSURANCE', 'IDENTITY_PROOF'];
  const verifiedDocCount = documents.filter((d: any) => d.status === 'VERIFIED').length;
  const allRequiredDocsVerified = requiredTypes.every((t) =>
    documents.some((d: any) => d.type === t && d.status === 'VERIFIED'),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Bar with Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          &larr; Back to Drivers
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '10px', color: '#FCA5A5' }}>
          {error}
        </div>
      )}
      {successMessage && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '10px', color: '#6EE7B7' }}>
          {successMessage}
        </div>
      )}

      {/* Main Profile Header Card */}
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
              {driver.user?.firstName} {driver.user?.lastName || ''}
            </h1>
            <Badge status={driver.verificationStatus} type="driver" />
            <Badge status={driver.status} type="driver" />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94A3B8', display: 'flex', gap: '1.25rem', marginTop: '0.5rem' }}>
            <span>📞 {driver.user?.phoneNumber || 'No phone'}</span>
            <span>✉️ {driver.user?.email || 'No email'}</span>
            <span>📍 City: {driver.city?.name || 'Kakinada'}</span>
          </div>
          {driver.rejectionReason && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px', color: '#F87171', fontSize: '0.8rem' }}>
              <strong>Rejection Reason:</strong> {driver.rejectionReason}
            </div>
          )}
          {driver.suspensionReason && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: '8px', color: '#FCA5A5', fontSize: '0.8rem' }}>
              <strong>Suspension Reason:</strong> {driver.suspensionReason}
            </div>
          )}
        </div>

        {/* Action Controls Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {driver.verificationStatus !== 'APPROVED' && driver.verificationStatus !== 'SUSPENDED' && (
            <button
              disabled={actionLoading || !allRequiredDocsVerified}
              onClick={handleApproveDriver}
              title={!allRequiredDocsVerified ? 'All 4 required documents must be verified first' : 'Approve Driver'}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: allRequiredDocsVerified ? '#10B981' : '#374151',
                color: allRequiredDocsVerified ? '#FFFFFF' : '#9CA3AF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: allRequiredDocsVerified ? 'pointer' : 'not-allowed',
                boxShadow: allRequiredDocsVerified ? '0 0 15px rgba(16,185,129,0.3)' : 'none',
              }}
            >
              ✓ Approve Driver
            </button>
          )}

          {driver.verificationStatus !== 'REJECTED' && driver.verificationStatus !== 'APPROVED' && (
            <button
              disabled={actionLoading}
              onClick={() => setRejectModalOpen(true)}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              ✕ Reject Application
            </button>
          )}

          {driver.verificationStatus === 'APPROVED' && (
            <button
              disabled={actionLoading}
              onClick={() => setSuspendModalOpen(true)}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#FCA5A5',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              ⚠️ Suspend Driver
            </button>
          )}

          {driver.verificationStatus === 'SUSPENDED' && (
            <button
              disabled={actionLoading}
              onClick={handleReactivateDriver}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: '#4F46E5',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Reactivate Driver
            </button>
          )}
        </div>
      </div>

      {/* Document Verification Matrix */}
      <div
        style={{
          backgroundColor: '#111827',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#F1F5F9' }}>
              Required Document Verification
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
              Drivers must have verified Driving License, Vehicle RC, Insurance, and ID Proof before approval.
            </p>
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: allRequiredDocsVerified ? '#34D399' : '#FBBF24' }}>
            {verifiedDocCount} of 4 Verified
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {requiredTypes.map((type) => {
            const doc = documents.find((d: any) => d.type === type);
            const isVerified = doc?.status === 'VERIFIED';
            const isPending = doc?.status === 'PENDING';
            const isRejected = doc?.status === 'REJECTED';

            return (
              <div
                key={type}
                style={{
                  padding: '1rem',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#F8FAFC' }}>
                      {type.replace(/_/g, ' ')}
                    </span>
                    <Badge status={doc ? doc.status : 'MISSING'} type="doc" />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.35rem' }}>
                    Doc Ref: {doc?.documentNumber || 'Ref pending'} • URL: {doc?.documentUrl || 'N/A'}
                  </div>
                  {doc?.rejectionReason && (
                    <div style={{ fontSize: '0.75rem', color: '#F87171', marginTop: '0.25rem' }}>
                      Reason: {doc.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Inline Document Controls */}
                {doc && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!isVerified && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleApproveDoc(doc.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          backgroundColor: '#10B981',
                          color: '#FFF',
                          border: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Verify
                      </button>
                    )}
                    {!isRejected && (
                      <button
                        disabled={actionLoading}
                        onClick={() => {
                          setRejectDocId(doc.id);
                          setRejectDocModalOpen(true);
                        }}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(239,68,68,0.2)',
                          color: '#F87171',
                          border: '1px solid rgba(239,68,68,0.4)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✕ Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Registered Vehicles */}
      <div
        style={{
          backgroundColor: '#111827',
          border: '1px solid #1E293B',
          borderRadius: '16px',
          padding: '1.75rem',
        }}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#F1F5F9' }}>
          Registered Vehicles
        </h2>
        {(!driver.vehicles || driver.vehicles.length === 0) ? (
          <div style={{ color: '#64748B', fontSize: '0.85rem' }}>No vehicles registered yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {driver.vehicles.map((v: any) => (
              <div
                key={v.id}
                style={{
                  padding: '1rem',
                  backgroundColor: '#1E293B',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.9rem' }}>
                    {v.registrationNumber}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                    {v.vehicleType?.displayName || v.vehicleType?.name} • {v.make} {v.model} ({v.year || 'N/A'})
                  </div>
                </div>
                <Badge status={v.isActive ? 'ACTIVE' : 'INACTIVE'} type="boolean" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Driver Application"
        description="Provide a clear, detailed reason for rejecting this driver onboarding application."
      >
        <form onSubmit={handleRejectDriver}>
          <textarea
            required
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Driving license image is expired or unreadable..."
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
              onClick={() => setRejectModalOpen(false)}
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
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>

      {/* Suspend Modal */}
      <Modal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        title="Suspend Driver Account"
        description="Provide a justification for suspending this driver. Driver will be set offline and cannot accept rides."
      >
        <form onSubmit={handleSuspendDriver}>
          <textarea
            required
            rows={4}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="e.g. Safety complaint investigation pending..."
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
              onClick={() => setSuspendModalOpen(false)}
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
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Confirm Suspension
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Document Modal */}
      <Modal
        isOpen={rejectDocModalOpen}
        onClose={() => setRejectDocModalOpen(false)}
        title="Reject Document"
        description="Provide a reason why this specific document does not meet verification requirements."
      >
        <form onSubmit={handleRejectDoc}>
          <textarea
            required
            rows={3}
            value={rejectDocReason}
            onChange={(e) => setRejectDocReason(e.target.value)}
            placeholder="e.g. Blurred photo, expired date, mismatched name..."
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
              onClick={() => setRejectDocModalOpen(false)}
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
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reject Document
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
