import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Connect to database on module startup
    await this.$connect();
  }

  async onModuleDestroy() {
    // Disconnect cleanly on module shutdown
    await this.$disconnect();
  }
}
