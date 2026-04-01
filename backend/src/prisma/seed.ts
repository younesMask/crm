import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      email: 'admin@crm.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  const userPassword = await bcrypt.hash('User@1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@crm.com' },
    update: {},
    create: {
      email: 'user@crm.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
    },
  });

  await prisma.contract.createMany({
    data: [
      {
        title: 'Website Redesign Project',
        clientName: 'Acme Corp',
        clientEmail: 'contact@acme.com',
        value: 15000,
        currency: 'USD',
        status: 'ACTIVE',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-06-30'),
        createdById: admin.id,
      },
      {
        title: 'Mobile App Development',
        clientName: 'TechStart Inc',
        clientEmail: 'info@techstart.com',
        value: 45000,
        currency: 'USD',
        status: 'PENDING',
        startDate: new Date('2026-03-01'),
        createdById: user.id,
      },
      {
        title: 'Marketing Consultation',
        clientName: 'Global Brands LLC',
        value: 8000,
        currency: 'USD',
        status: 'DRAFT',
        createdById: user.id,
      },
    ],
  });

  console.log('Seed complete.');
  console.log('Admin: admin@crm.com / Admin@1234');
  console.log('User:  user@crm.com / User@1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
