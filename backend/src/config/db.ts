import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in the environment variables");
}

const createPrismaClient = () => {
  if (process.env.DB_ADAPTER === 'neon') {
    neonConfig.webSocketConstructor = ws;
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
};

export const prisma = createPrismaClient();