'use client';

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/auth-context';
import { AdminLayout } from '../components/AdminLayout';
import { DashboardView } from '../components/views/DashboardView';
import { DriversView } from '../components/views/DriversView';
import { DriverDetailView } from '../components/views/DriverDetailView';
import { VehiclesView } from '../components/views/VehiclesView';
import { RidesView } from '../components/views/RidesView';
import { RideDetailView } from '../components/views/RideDetailView';
import { CitiesView } from '../components/views/CitiesView';
import { PricingView } from '../components/views/PricingView';
import { AuditLogsView } from '../components/views/AuditLogsView';
import { SafetyView } from '../components/views/SafetyView';
import { SupportTicketsView } from '../components/views/SupportTicketsView';
import { IncidentsView } from '../components/views/IncidentsView';
import { api } from '../lib/api';

function AdminApp() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [pendingDriversCount, setPendingDriversCount] = useState<number>(0);

  // Login form state
  const [email, setEmail] = useState('admin@yatraseeva.com');
  const [password, setPassword] = useState('admin123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Periodically update pending count for sidebar badge
  useEffect(() => {
    if (isAuthenticated) {
      api.getDashboardStats().then((data) => {
        if (data?.drivers?.pending !== undefined) {
          setPendingDriversCount(data.drivers.pending);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, currentTab]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid admin credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#090D16',
          color: '#94A3B8',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#070B14',
          color: '#E5E7EB',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '420px',
            width: '100%',
            backgroundColor: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '20px',
            padding: '2.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(79, 70, 229, 0.1)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: '#4F46E5',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                marginBottom: '1rem',
                boxShadow: '0 0 25px rgba(79, 70, 229, 0.5)',
              }}
            >
              🛡️
            </div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC' }}>
              YatraSeva Operations
            </h1>
            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: '#94A3B8' }}>
              Sign in with operator credentials to manage Kakinada dispatch.
            </p>
          </div>

          {loginError && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                borderRadius: '10px',
                color: '#FCA5A5',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                Operator Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yatraseeva.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '0.35rem' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                borderRadius: '10px',
                backgroundColor: '#4F46E5',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: loginLoading ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
                transition: 'background 0.2s ease',
              }}
            >
              {loginLoading ? 'Authenticating...' : 'Sign In to Operations'}
            </button>
          </form>

          <div
            style={{
              marginTop: '1.75rem',
              padding: '0.75rem',
              backgroundColor: '#131D33',
              borderRadius: '8px',
              border: '1px solid #1E293B',
              fontSize: '0.75rem',
              color: '#64748B',
              textAlign: 'center',
            }}
          >
            Default Dev Credentials: <br />
            <strong style={{ color: '#94A3B8' }}>admin@yatraseeva.com</strong> / <strong style={{ color: '#94A3B8' }}>admin123</strong>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={(tab) => {
        setCurrentTab(tab);
        setSelectedDriverId(null);
        setSelectedRideId(null);
      }}
      pendingDriversCount={pendingDriversCount}
    >
      {currentTab === 'dashboard' && (
        <DashboardView
          onNavigate={(tab, id) => {
            if (tab === 'ride-detail' && id) {
              setSelectedRideId(id);
              setCurrentTab('ride-detail');
            } else {
              setCurrentTab(tab);
            }
          }}
        />
      )}

      {currentTab === 'drivers' && (
        <DriversView
          onSelectDriver={(driverId) => {
            setSelectedDriverId(driverId);
            setCurrentTab('driver-detail');
          }}
        />
      )}

      {currentTab === 'driver-detail' && selectedDriverId && (
        <DriverDetailView
          driverId={selectedDriverId}
          onBack={() => {
            setSelectedDriverId(null);
            setCurrentTab('drivers');
          }}
        />
      )}

      {currentTab === 'vehicles' && <VehiclesView />}

      {currentTab === 'rides' && (
        <RidesView
          onSelectRide={(rideId) => {
            setSelectedRideId(rideId);
            setCurrentTab('ride-detail');
          }}
        />
      )}

      {currentTab === 'ride-detail' && selectedRideId && (
        <RideDetailView
          rideId={selectedRideId}
          onBack={() => {
            setSelectedRideId(null);
            setCurrentTab('rides');
          }}
        />
      )}

      {currentTab === 'cities' && <CitiesView />}

      {currentTab === 'pricing' && <PricingView />}

      {currentTab === 'safety' && <SafetyView />}

      {currentTab === 'support' && <SupportTicketsView />}

      {currentTab === 'incidents' && <IncidentsView />}

      {currentTab === 'audit-logs' && <AuditLogsView />}
    </AdminLayout>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <AdminApp />
    </AuthProvider>
  );
}
