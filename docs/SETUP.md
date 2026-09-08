# YatraSeva — Local Development Setup

## Prerequisites

- **Node.js** ≥ 20.x (tested with 24.14)
- **npm** ≥ 10.x (tested with 11.9)
- **Git** ≥ 2.x

SQLite is used for development — no database installation needed.

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd yatra-seva
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env if needed (defaults work for development)

# 3. Set up database
npm run db:generate          # Generate Prisma client
npx --workspace=packages/db prisma db push   # Create SQLite database
npm run db:seed              # Seed development data

# 4. Build shared packages
npm run build --filter=@yatra-seva/shared-types
npm run build --filter=@yatra-seva/service-contracts

# 5. Start the API
cd apps/api
npm run start:dev
# API runs on http://localhost:3000
# Swagger docs at http://localhost:3000/docs
# Health check: GET http://localhost:3000/api/v1/health

# 6. Start the admin dashboard (separate terminal)
cd apps/admin
npm run dev
# Dashboard runs on http://localhost:3001

# 7. Start mobile apps (separate terminal)
cd apps/rider    # or apps/driver
npm run dev
# Expo dev server starts
```

## Environment Variables

See `.env.example` for all configuration options. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | API server port |
| `DATABASE_URL` | `file:./dev.db` | SQLite database path |
| `JWT_SECRET` | `dev-jwt-secret...` | JWT signing secret |
| `OTP_PROVIDER` | `mock` | OTP service (mock/twilio) |
| `PAYMENT_PROVIDER` | `mock` | Payment service (mock/razorpay) |
| `MAP_PROVIDER` | `mock` | Map service (mock/google) |
| `MOCK_OTP_CODE` | `123456` | Fixed OTP for development |

## Mock Services

In development mode, all external services are mocked:

| Service | Mock Behavior |
|---------|--------------|
| OTP | Always accepts code `123456` |
| Payment | Always returns success, never charges money |
| Maps | Returns hardcoded Kakinada locations |
| Routing | Returns straight-line distance × 1.4 |
| Notifications | Logs to console |

## Seed Data

After running `npm run db:seed`:

| Entity | Data |
|--------|------|
| City | Kakinada (16.9891, 82.2475) |
| Vehicle Types | BIKE, AUTO, CAB |
| Admin | admin@yatraseeva.com |
| Riders | +919000000001, +919000000002, +919000000003 |
| Drivers | +918000000001 (Bike), +918000000002 (Auto), +918000000003 (Cab) |

## Running Tests

```bash
# All tests across monorepo
npm run test

# Specific package
cd packages/shared-types && npm test
cd apps/api && npm test

# With coverage
cd apps/api && npm run test:cov
```

## Useful Commands

```bash
npm run build          # Build all packages and apps
npm run type-check     # TypeScript type checking
npm run lint           # Linting
npm run format         # Format code with Prettier
npm run db:studio      # Open Prisma Studio (visual DB browser)
```
