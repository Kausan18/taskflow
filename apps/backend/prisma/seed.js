'use strict';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create org
  const org = await prisma.organisation.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
    },
  });

  // Create admin user
  const adminHash = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      orgId: org.id,
      email: 'admin@acme.com',
      passwordHash: adminHash,
      name: 'Aryan R.',
      role: 'ADMIN',
    },
  });

  // Create member user
  const memberHash = await bcrypt.hash('Member123!', 12);
  const member = await prisma.user.upsert({
    where: { email: 'member@acme.com' },
    update: {},
    create: {
      orgId: org.id,
      email: 'member@acme.com',
      passwordHash: memberHash,
      name: 'Kira P.',
      role: 'MEMBER',
    },
  });

  // Create sample tasks matching the Kanban screenshot
  const tasksData = [
    {
      orgId: org.id,
      creatorId: admin.id,
      assigneeId: admin.id,
      title: 'Set up Supabase RLS policies for task table',
      status: 'TODO',
      priority: 'HIGH',
      category: 'Backend',
      dueDate: new Date('2026-04-22'),
    },
    {
      orgId: org.id,
      creatorId: member.id,
      assigneeId: member.id,
      title: 'Write Zod validation schema for task creation',
      status: 'TODO',
      priority: 'MED',
      category: 'Backend',
      dueDate: new Date('2026-04-25'),
    },
    {
      orgId: org.id,
      creatorId: member.id,
      title: 'Add Google OAuth callback page',
      status: 'TODO',
      priority: 'LOW',
      category: 'Frontend',
      dueDate: new Date('2026-04-28'),
    },
    {
      orgId: org.id,
      creatorId: admin.id,
      assigneeId: admin.id,
      title: 'Build refresh token rotation logic',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'Security',
      dueDate: new Date('2026-04-24'),
    },
    {
      orgId: org.id,
      creatorId: member.id,
      assigneeId: member.id,
      title: 'Kanban board drag-and-drop UI',
      status: 'IN_PROGRESS',
      priority: 'MED',
      category: 'Frontend',
      dueDate: new Date('2026-04-26'),
    },
    {
      orgId: org.id,
      creatorId: admin.id,
      title: 'Audit log JSONB snapshot differ',
      status: 'IN_PROGRESS',
      priority: 'MED',
      category: 'Backend',
      dueDate: new Date('2026-04-27'),
    },
    {
      orgId: org.id,
      creatorId: admin.id,
      assigneeId: admin.id,
      title: 'JWT RS256 signing + middleware',
      status: 'IN_REVIEW',
      priority: 'HIGH',
      category: 'Security',
      dueDate: new Date('2026-04-23'),
    },
    {
      orgId: org.id,
      creatorId: member.id,
      assigneeId: member.id,
      title: 'Sidebar nav with role-based visibility',
      status: 'IN_REVIEW',
      priority: 'LOW',
      category: 'Frontend',
      dueDate: new Date('2026-04-23'),
    },
  ];

  for (const t of tasksData) {
    await prisma.task.create({ data: t });
  }

  console.log('✅ Seed complete');
  console.log('   Admin:  admin@acme.com / Admin123!');
  console.log('   Member: member@acme.com / Member123!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());