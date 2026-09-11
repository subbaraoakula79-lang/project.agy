require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('Testing DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30));
  try {
    await prisma.$connect();
    console.log('SUCCESSFULLY CONNECTED TO NEON POSTGRESQL!');
    const users = await prisma.user.count();
    console.log('User count in DB:', users);
  } catch (err) {
    console.error('DATABASE CONNECTION ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
