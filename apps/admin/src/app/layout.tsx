/**
 * YatraSeva Admin Dashboard — Root Layout
 *
 * Pages to be built in later phases:
 * - /login        — Admin email + password login
 * - /dashboard    — Overview metrics, active rides, online drivers
 * - /riders       — Rider management
 * - /drivers      — Driver management, verification
 * - /vehicles     — Vehicle registry
 * - /rides        — Ride monitoring and history
 * - /payments     — Payment transactions
 * - /pricing      — Fare configuration per city/vehicle
 * - /cities       — City management
 * - /reports      — Analytics and reports
 * - /safety       — Complaints and safety incidents
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YatraSeva Admin',
  description: 'YatraSeva ride-hailing platform admin dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>{children}</body>
    </html>
  );
}
