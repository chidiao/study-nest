import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { requireEnv } from '../config/env';
import { PrismaClient } from '../generated/prisma/client';

function withPublicKeyRetrieval(connectionString: string): string {
  const url = new URL(connectionString);
  url.searchParams.set('allowPublicKeyRetrieval', 'true');
  return url.toString();
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaMariaDb(
        withPublicKeyRetrieval(requireEnv('DATABASE_URL')),
      ),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
