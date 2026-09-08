# YatraSeva — Architecture Overview

India-first ride-hailing platform launching in Kakinada, Andhra Pradesh.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────────┐  │
│  │  Rider   │  │  Driver  │  │     Admin Dashboard          │  │
│  │  App     │  │  App     │  │     (Next.js)                │  │
│  │  (Expo)  │  │  (Expo)  │  │                              │  │
│  └────┬─────┘  └────┬─────┘  └──────────────┬───────────────┘  │
│       │              │                        │                  │
└───────┼──────────────┼────────────────────────┼──────────────────┘
        │              │                        │
        │    REST API (HTTPS)   +   WebSocket   │
        │              │                        │
┌───────┼──────────────┼────────────────────────┼──────────────────┐
│       ▼              ▼                        ▼                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  NestJS API Server                        │   │
│  │                                                           │   │
│  │  ┌─────────┐ ┌────────┐ ┌───────┐ ┌──────┐ ┌────────┐  │   │
│  │  │  Auth   │ │ Rides  │ │ Fare  │ │ Pay  │ │ Admin  │  │   │
│  │  │ Module  │ │ Module │ │ Module│ │Module│ │ Module │  │   │
│  │  └────┬────┘ └───┬────┘ └───┬───┘ └──┬───┘ └───┬────┘  │   │
│  │       │          │          │         │          │        │   │
│  │  ┌────▼──────────▼──────────▼─────────▼──────────▼────┐  │   │
│  │  │           Service Provider Layer                    │  │   │
│  │  │                                                     │  │   │
│  │  │  IOtpService → MockOtpService | TwilioService      │  │   │
│  │  │  IPaymentService → MockPayment | RazorpayService   │  │   │
│  │  │  IMapService → MockMap | GoogleMapsService         │  │   │
│  │  │  IRoutingService → MockRouting | GoogleRouting      │  │   │
│  │  │  INotificationService → MockNotif | FCMService     │  │   │
│  │  │                                                     │  │   │
│  │  │  Selected via env: OTP_PROVIDER=mock|twilio         │  │   │
│  │  └────────────────────────┬───────────────────────────┘  │   │
│  └───────────────────────────┼──────────────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────▼──────────────────────────────┐   │
│  │              SQLite (dev) / PostgreSQL (prod)             │   │
│  │              Prisma ORM — packages/db                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         BACKEND                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
yatra-seva/
├── apps/
│   ├── api/           → NestJS backend (REST + WebSocket)
│   ├── rider/         → Expo React Native rider app
│   ├── driver/        → Expo React Native driver/captain app
│   └── admin/         → Next.js admin dashboard
├── packages/
│   ├── shared-types/  → TypeScript enums, interfaces, constants
│   ├── shared-config/ → Base TSConfig, ESLint configs
│   ├── service-contracts/ → Service interface definitions
│   └── db/            → Prisma schema, migrations, seed data
├── docs/              → Architecture & developer documentation
├── .env.example       → Environment variable template
├── turbo.json         → Turborepo task pipeline
└── package.json       → npm workspace root
```

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Backend | NestJS | 11.x |
| Database | SQLite (dev) / PostgreSQL (prod) | — |
| ORM | Prisma | 6.x |
| Mobile Apps | React Native + Expo | SDK 53 |
| Admin Dashboard | Next.js | 15.x |
| Language | TypeScript | 5.8+ |
| Monorepo | Turborepo + npm workspaces | 2.x |
| Testing | Jest + ts-jest | 29.x |
| API Docs | Swagger/OpenAPI | via @nestjs/swagger |

## Service Provider Pattern

All external integrations follow the **interface → implementation** pattern:

1. Interface defined in `packages/service-contracts/`
2. Mock implementation in `apps/api/src/providers/mock/`
3. Real implementation (future) in `apps/api/src/providers/real/`
4. NestJS factory provider selects implementation based on env config

Environment variables controlling providers:
- `OTP_PROVIDER=mock` — OTP/SMS service
- `PAYMENT_PROVIDER=mock` — Payment processing
- `MAP_PROVIDER=mock` — Geocoding, place search, routing
- `NOTIFICATION_PROVIDER=mock` — Push notifications

## Ride State Machine

14 explicit states with validated transitions. See `packages/shared-types/src/constants/ride-state-machine.ts`.

Terminal states: `COMPLETED`, `CANCELLED_BY_RIDER`, `CANCELLED_BY_DRIVER`, `CANCELLED_NO_DRIVER`

## Database

13 entities managed by Prisma. See `packages/db/prisma/schema.prisma`.

Key design decisions:
- Single `User` table with role field + optional profile relations
- Pricing keyed by `(cityId, vehicleTypeId)` — no hardcoded values
- Soft deletion on `User`, `Vehicle`, `DriverProfile`
- Full ride lifecycle timestamps for analytics
