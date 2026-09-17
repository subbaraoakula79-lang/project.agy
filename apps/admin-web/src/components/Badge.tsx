import React from 'react';

interface BadgeProps {
  status: string;
  type?: 'driver' | 'ride' | 'doc' | 'boolean';
}

export function Badge({ status, type = 'driver' }: BadgeProps) {
  let bg = '#374151';
  let color = '#E5E7EB';
  let border = '#4B5563';

  const s = (status || '').toUpperCase();

  if (s === 'APPROVED' || s === 'VERIFIED' || s === 'COMPLETED' || s === 'ACTIVE' || s === 'TRUE' || s === 'ONLINE_AVAILABLE') {
    bg = 'rgba(16, 185, 129, 0.15)';
    color = '#34D399';
    border = 'rgba(16, 185, 129, 0.3)';
  } else if (s === 'PENDING' || s === 'REQUESTED' || s === 'SEARCHING_DRIVER') {
    bg = 'rgba(245, 158, 11, 0.15)';
    color = '#FBBF24';
    border = 'rgba(245, 158, 11, 0.3)';
  } else if (s === 'UNDER_REVIEW' || s === 'DRIVER_ASSIGNED' || s === 'DRIVER_ARRIVING' || s === 'RIDE_STARTED' || s === 'RIDE_IN_PROGRESS') {
    bg = 'rgba(99, 102, 241, 0.15)';
    color = '#818CF8';
    border = 'rgba(99, 102, 241, 0.3)';
  } else if (s === 'REJECTED' || s.startsWith('CANCELLED') || s === 'FAILED' || s === 'INACTIVE' || s === 'FALSE') {
    bg = 'rgba(239, 68, 68, 0.15)';
    color = '#F87171';
    border = 'rgba(239, 68, 68, 0.3)';
  } else if (s === 'SUSPENDED') {
    bg = 'rgba(220, 38, 38, 0.25)';
    color = '#FCA5A5';
    border = 'rgba(220, 38, 38, 0.5)';
  } else if (s === 'OFFLINE') {
    bg = 'rgba(107, 114, 128, 0.2)';
    color = '#9CA3AF';
    border = 'rgba(107, 114, 128, 0.4)';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.025em',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: color,
          marginRight: '0.35rem',
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      {s.replace(/_/g, ' ')}
    </span>
  );
}
