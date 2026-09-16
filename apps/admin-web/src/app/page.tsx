'use client';

import React, { useState } from 'react';

/**
 * YatraSeva Admin Dashboard — Auth Flow & Shell.
 * Unauthenticated -> Admin Login (Email + Password) -> Protected Admin Shell
 */
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('admin@yatraseeva.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminUser, setAdminUser] = useState<{ email: string; role: string } | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (email === 'admin@yatraseeva.com' && password === 'admin123') {
        setIsAuthenticated(true);
        setAdminUser({ email, role: 'ADMIN' });
      } else {
        setError('Invalid admin credentials. Use admin@yatraseeva.com / admin123');
      }
    }, 600);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0a1a',
        color: '#eaeaea',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', color: '#e94560', marginBottom: '0.5rem' }}>
        🛡️ YatraSeva Admin
      </h1>
      <p style={{ fontSize: '1rem', color: '#8a8a9a', marginBottom: '2rem' }}>
        Management Platform — Kakinada Operations
      </p>

      {!isAuthenticated ? (
        <form
          onSubmit={handleLogin}
          style={{
            width: '100%',
            maxWidth: '380px',
            backgroundColor: '#16213e',
            padding: '32px',
            borderRadius: '12px',
            border: '1px solid #0f3460',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0, textAlign: 'center' }}>
            Admin Portal Login
          </h2>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(233, 69, 96, 0.15)',
                color: '#ff6b6b',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: '#8a8a9a' }}>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yatraseeva.com"
              required
              style={{
                backgroundColor: '#0f3460',
                border: '1px solid #1a1a2e',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: '#8a8a9a' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                backgroundColor: '#0f3460',
                border: '1px solid #1a1a2e',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#e94560',
              color: '#ffffff',
              border: 'none',
              padding: '12px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: '8px',
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>
      ) : (
        <div
          style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: '#16213e',
            padding: '32px',
            borderRadius: '12px',
            border: '1px solid #0f3460',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(83, 168, 182, 0.15)',
              color: '#53a8b6',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            🛡️ Protected Admin Shell Active
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0 }}>
            Welcome, System Administrator
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#8a8a9a', margin: 0 }}>
            Authenticated as: <strong style={{ color: '#ffffff' }}>{adminUser?.email}</strong>
          </p>

          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#53354a',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '12px',
            }}
          >
            Logout Admin Session
          </button>
        </div>
      )}
    </main>
  );
}
