import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool as any);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// እዚህ ጋር 'as any' በመጠቀም TypeScript እንዲቀበለው እናደርጋለን
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter } as any); 

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;