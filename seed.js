const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Define your initial admin details
  const adminEmail = 'abaytefera29@gmail.com'; 
  const rawPassword = 'Abu4858@'; // Change this!

  // 2. Check if the admin user already exists to prevent duplicates
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log(`⚠️ User with email ${adminEmail} already exists. Skipping seed.`);
    return;
  }

  // 3. Hash the password securely
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

  // 4. Insert the first authenticated user into MySQL
  const adminUser = await prisma.user.create({
    data: {
      firstName: 'abay ',
      lastName: 'tefera',
      email: adminEmail,
      passwordHash: passwordHash,
      role: UserRole.ADMIN, // Uses the UserRole enum from your schema
      isActive: true,
      jobTitle: 'Lead Administrator',
      department: 'Management',
      hireDate: new Date(),
      backgroundCheckStatus: 'CLEARED',
      backgroundCheckDate: new Date(),
    },
  });

  console.log('==================================================');
  console.log('✅ First authenticated User created successfully!');
  console.log(`📧 Email: ${adminUser.email}`);
  console.log(`🔒 Password: ${rawPassword}`);
  console.log('==================================================');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });