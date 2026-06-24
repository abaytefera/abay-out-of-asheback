const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// 1. ዳታቤዝ ግንኙነት - ሊንኩን በቀጥታ አስገባ
const dbUrl ="postgresql://neondb_owner:npg_sCcI5dvfr0bF@ep-proud-sun-a63hodnx-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

// 2. Pool እና Prisma ማዋቀር
const pool = new Pool({ 
  connectionString: dbUrl,
  ssl: true 
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seed እየጀመረ ነው...');

    try {
        // የይለፍ ቃል ማዘጋጀት
        const passwordHash = await bcrypt.hash('Abu4858@', 10);

        // ተጠቃሚውን መፍጠር (upsert ተጠቃሚው ካለ እንዳይደግመው ይረዳል)
        const admin = await prisma.user.upsert({
            where: { email: 'abaytefera29@gmail.com' },
            update: {}, // ካለ ምንም አትቀይር
            create: {
                firstName: 'abay',
                lastName: 'tefera',
                email: 'abaytefera29@gmail.com',
                passwordHash: passwordHash,
                role: 'ADMIN',
                isActive: true,
                jobTitle: 'Lead Administrator',
                department: 'Management',
                hireDate: new Date(),
                backgroundCheckStatus: 'CLEARED',
                backgroundCheckDate: new Date(),
            },
        });

        console.log('✅ አድሚን ተጠቃሚ በተሳካ ሁኔታ ተፈጥሯል!', admin.email);
    } catch (error) {
        console.error('❌ የዳታቤዝ ስህተት:', error.message || error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();