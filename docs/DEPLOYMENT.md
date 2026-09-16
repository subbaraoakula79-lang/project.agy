# YatraSeva — Deployment Architecture

## Application Architecture

YatraSeva consists of **4 independently buildable/deployable applications**
sharing a common backend API and Neon PostgreSQL database.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Rider Mobile   │    │  Driver Mobile   │    │   Admin Web     │
│  (Android APK)  │    │  (Android APK)   │    │  (Next.js Web)  │
│                 │    │                  │    │                 │
│ com.yatraseeva  │    │ com.yatraseeva   │    │ admin.<domain>  │
│     .rider      │    │     .driver      │    │                 │
└────────┬────────┘    └────────┬─────────┘    └────────┬────────┘
         │                      │                       │
         └──────────┬───────────┴───────────────────────┘
                    │
         ┌──────────▼──────────┐
         │    Common Backend    │
         │   (NestJS + Node)    │
         │  api.<domain>:3000   │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │  Neon PostgreSQL     │
         │ (Managed Cloud DB)   │
         └─────────────────────┘
```

---

## Directory Structure

```
apps/
  rider-mobile/       # Android Rider app (Expo + React Native)
  driver-mobile/      # Android Driver/Captain app (Expo + React Native)
  admin-web/          # Admin dashboard (Next.js web)
  api/                # Common backend (NestJS)

packages/
  db/                 # Prisma schema, client, seeds
  shared-types/       # Shared TypeScript types & enums
  shared-config/      # Shared configuration constants
  service-contracts/  # Service interface contracts
```

---

## Deployment Targets

| Application      | Platform                    | Build Method          |
|-----------------|-----------------------------|-----------------------|
| Rider Mobile    | Android APK / Google Play   | EAS Build / `expo build` |
| Driver Mobile   | Android APK / Google Play   | EAS Build / `expo build` |
| Admin Web       | Vercel / similar            | `next build`          |
| Backend API     | Render / Railway / similar  | `nest build` → `node dist/main.js` |
| Database        | Neon PostgreSQL             | Managed service       |

---

## Android Application IDs

| App            | Package ID               |
|----------------|--------------------------|
| Rider Mobile   | `com.yatraseeva.rider`   |
| Driver Mobile  | `com.yatraseeva.driver`  |

These are **distinct** — Rider and Driver will install as separate apps on Android devices.

---

## Environment Variables

### Public (Client-Side, Safe to Bundle)

These are exposed in mobile app bundles or browser JavaScript.
They contain **no secrets**.

| Variable             | Used By          | Example                            |
|---------------------|------------------|------------------------------------|
| `EXPO_PUBLIC_API_URL` | Rider, Driver    | `https://api.yatraseeva.com`       |
| `EXPO_PUBLIC_WS_URL`  | Rider, Driver    | `https://api.yatraseeva.com`       |
| `NEXT_PUBLIC_API_URL` | Admin Web        | `https://api.yatraseeva.com`       |
| `NEXT_PUBLIC_WS_URL`  | Admin Web        | `https://api.yatraseeva.com`       |

### Server-Side Only (Backend, NEVER Expose)

These must **only** be configured on the backend deployment platform.
They must **never** appear in mobile app bundles or browser code.

| Variable              | Purpose                          |
|-----------------------|----------------------------------|
| `DATABASE_URL`        | Neon PostgreSQL connection string |
| `JWT_SECRET`          | JWT signing secret               |
| `JWT_REFRESH_SECRET`  | Refresh token signing secret     |
| `RAZORPAY_KEY_SECRET` | Payment provider secret          |
| `TWILIO_AUTH_TOKEN`   | SMS/OTP provider secret          |
| `GOOGLE_MAPS_API_KEY` | Maps provider key                |
| `FCM_SERVER_KEY`      | Push notification key            |
| `ADMIN_DEFAULT_PASSWORD` | Admin bootstrap password      |

---

## API URL Configuration

### Development

All clients connect to the local backend:

```
Rider Mobile  → http://192.168.1.x:3000
Driver Mobile → http://192.168.1.x:3000
Admin Web     → http://localhost:3000
```

### Production

All clients connect to the production API:

```
Rider Mobile  → https://api.<production-domain>
Driver Mobile → https://api.<production-domain>
Admin Web     → https://api.<production-domain>
```

> **Note**: The production domain has not been finalized. Replace `<production-domain>` with the actual domain when available.

---

## Realtime (Socket.IO)

All three clients connect to the **same** Socket.IO server running on the common backend.

- JWT authentication is enforced on connection
- Private ride rooms isolate events per ride
- Driver rooms isolate events per driver
- No separate realtime server is needed

---

## Build Commands

```bash
# Backend API
cd apps/api && npm run build

# Admin Web
cd apps/admin-web && npm run build

# Rider Mobile (via EAS or local)
cd apps/rider-mobile && eas build --platform android
# or for local development:
cd apps/rider-mobile && expo start

# Driver Mobile (via EAS or local)
cd apps/driver-mobile && eas build --platform android
# or for local development:
cd apps/driver-mobile && expo start
```

---

## Database

- **Provider**: Neon PostgreSQL (managed)
- **ORM**: Prisma
- **Schema**: `packages/db/prisma/schema.prisma`
- **Migrations**: `npx prisma db push` (development) / `npx prisma migrate deploy` (production)
