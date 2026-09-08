import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed the database with initial development data.
 *
 * Creates:
 * - 1 City (Kakinada)
 * - 3 Vehicle types (BIKE, AUTO, CAB)
 * - 3 Pricing configs (per vehicle type)
 * - 1 Admin user
 * - 3 Test riders
 * - 3 Test drivers (one per vehicle type)
 * - 3 Test vehicles
 */
async function main() {
  console.log('🌱 Seeding database...\n');

  // ── City ──────────────────────────────────────────────────────
  const kakinada = await prisma.city.upsert({
    where: { name: 'Kakinada' },
    update: {},
    create: {
      name: 'Kakinada',
      state: 'Andhra Pradesh',
      country: 'India',
      latitude: 16.9891,
      longitude: 82.2475,
      isActive: true,
      timezone: 'Asia/Kolkata',
    },
  });
  console.log(`✅ City: ${kakinada.name} (${kakinada.id})`);

  // ── Vehicle Types ─────────────────────────────────────────────
  const bikeType = await prisma.vehicleType.upsert({
    where: { name: 'BIKE' },
    update: {},
    create: {
      name: 'BIKE',
      displayName: 'Bike',
      maxPassengers: 1,
      description: 'Quick and affordable two-wheeler rides',
    },
  });

  const autoType = await prisma.vehicleType.upsert({
    where: { name: 'AUTO' },
    update: {},
    create: {
      name: 'AUTO',
      displayName: 'Auto Rickshaw',
      maxPassengers: 3,
      description: 'Classic three-wheeler auto rickshaw',
    },
  });

  const cabType = await prisma.vehicleType.upsert({
    where: { name: 'CAB' },
    update: {},
    create: {
      name: 'CAB',
      displayName: 'Cab',
      maxPassengers: 4,
      description: 'Comfortable four-wheeler cab',
    },
  });
  console.log(`✅ Vehicle Types: BIKE, AUTO, CAB`);

  // ── Pricing Configs (Kakinada) ────────────────────────────────
  const pricingData = [
    {
      cityId: kakinada.id,
      vehicleTypeId: bikeType.id,
      baseFare: 20,
      perKmRate: 8,
      perMinRate: 1,
      minimumFare: 30,
    },
    {
      cityId: kakinada.id,
      vehicleTypeId: autoType.id,
      baseFare: 30,
      perKmRate: 12,
      perMinRate: 1.5,
      minimumFare: 40,
    },
    {
      cityId: kakinada.id,
      vehicleTypeId: cabType.id,
      baseFare: 50,
      perKmRate: 15,
      perMinRate: 2,
      minimumFare: 80,
    },
  ];

  for (const pricing of pricingData) {
    await prisma.pricingConfig.upsert({
      where: {
        cityId_vehicleTypeId: {
          cityId: pricing.cityId,
          vehicleTypeId: pricing.vehicleTypeId,
        },
      },
      update: {},
      create: pricing,
    });
  }
  console.log(`✅ Pricing: 3 configs for Kakinada`);

  // ── Admin User ────────────────────────────────────────────────
  // Password: admin123 — bcrypt hash generated offline for seed safety
  // In real implementation, AuthService would hash this on registration.
  // For seed, we store a placeholder — actual password hashing happens in the API.
  const admin = await prisma.user.upsert({
    where: { email: 'admin@yatraseeva.com' },
    update: {},
    create: {
      email: 'admin@yatraseeva.com',
      firstName: 'Admin',
      lastName: 'YatraSeva',
      role: 'ADMIN',
      passwordHash: '$dev-placeholder$', // Will be set properly by AuthService
      isActive: true,
    },
  });
  console.log(`✅ Admin: ${admin.email} (${admin.id})`);

  // ── Test Riders ───────────────────────────────────────────────
  const riderPhones = ['+919000000001', '+919000000002', '+919000000003'];
  const riderNames = [
    { first: 'Priya', last: 'Sharma' },
    { first: 'Ravi', last: 'Kumar' },
    { first: 'Anitha', last: 'Reddy' },
  ];

  for (let i = 0; i < riderPhones.length; i++) {
    const rider = await prisma.user.upsert({
      where: { phoneNumber: riderPhones[i] },
      update: {},
      create: {
        phoneNumber: riderPhones[i],
        firstName: riderNames[i]!.first,
        lastName: riderNames[i]!.last,
        role: 'RIDER',
        isActive: true,
        riderProfile: {
          create: {
            preferredPayment: 'CASH',
          },
        },
      },
    });
    console.log(`✅ Rider: ${rider.phoneNumber} — ${rider.firstName} ${rider.lastName}`);
  }

  // ── Test Drivers ──────────────────────────────────────────────
  const driverData = [
    {
      phone: '+918000000001',
      first: 'Suresh',
      last: 'Babu',
      vehicleType: bikeType,
      regNumber: 'AP05AB1234',
      make: 'Honda',
      model: 'Activa 6G',
      color: 'Black',
      year: 2023,
      lat: 16.9910,
      lng: 82.2490,
    },
    {
      phone: '+918000000002',
      first: 'Ramesh',
      last: 'Naidu',
      vehicleType: autoType,
      regNumber: 'AP05CD5678',
      make: 'Bajaj',
      model: 'RE Compact',
      color: 'Green',
      year: 2022,
      lat: 16.9870,
      lng: 82.2450,
    },
    {
      phone: '+918000000003',
      first: 'Venkat',
      last: 'Rao',
      vehicleType: cabType,
      regNumber: 'AP05EF9012',
      make: 'Maruti',
      model: 'Swift Dzire',
      color: 'White',
      year: 2024,
      lat: 16.9850,
      lng: 82.2500,
    },
  ];

  for (const d of driverData) {
    const driver = await prisma.user.upsert({
      where: { phoneNumber: d.phone },
      update: {},
      create: {
        phoneNumber: d.phone,
        firstName: d.first,
        lastName: d.last,
        role: 'DRIVER',
        isActive: true,
        driverProfile: {
          create: {
            cityId: kakinada.id,
            status: 'ONLINE',
            isVerified: true,
            isOnboarded: true,
            currentLatitude: d.lat,
            currentLongitude: d.lng,
            lastLocationAt: new Date(),
            vehicles: {
              create: {
                vehicleTypeId: d.vehicleType.id,
                registrationNumber: d.regNumber,
                make: d.make,
                model: d.model,
                color: d.color,
                year: d.year,
                isActive: true,
                isDefault: true,
              },
            },
          },
        },
      },
    });
    console.log(
      `✅ Driver: ${driver.phoneNumber} — ${driver.firstName} ${driver.lastName} (${d.vehicleType.name})`,
    );
  }

  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
