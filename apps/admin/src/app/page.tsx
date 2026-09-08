/**
 * Admin dashboard home page placeholder.
 * Will be replaced with login redirect / dashboard in Phase 2+.
 */
export default function AdminHomePage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0a1a',
        color: '#eaeaea',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', color: '#e94560', marginBottom: '0.5rem' }}>
        🛡️ YatraSeva Admin
      </h1>
      <p style={{ fontSize: '1.1rem', color: '#8a8a9a', marginBottom: '2rem' }}>
        Admin Dashboard — Kakinada, Andhra Pradesh
      </p>
      <div
        style={{
          backgroundColor: '#16213e',
          padding: '12px 24px',
          borderRadius: '20px',
          border: '1px solid #0f3460',
        }}
      >
        <span style={{ color: '#53a8b6', fontSize: '0.85rem', fontWeight: 600 }}>
          Phase 0 — Foundation
        </span>
      </div>
    </div>
  );
}
