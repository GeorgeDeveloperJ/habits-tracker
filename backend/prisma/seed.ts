import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const coreCategories = [
    { name: 'Learning', description: 'Studying, reading, and personal growth' },
    { name: 'Physical Health', description: 'Exercise, training, and movement' },
    { name: 'Nutrition', description: 'Eating habits, hydration, and overall wellness' },
    { name: 'Mindfulness', description: 'Meditation, reflection, and mental well-being' },
    { name: 'Work / Focus', description: 'Focused work sessions and productive activities' },
    { name: 'Finance', description: 'Expense tracking, budgeting, and financial literacy' },
    { name: 'Organization', description: 'Planning, organization, and maintaining a tidy environment' },
    { name: 'Rest', description: 'Sleep quality, recovery, and digital disconnection' },
  ];

  console.log('🌱 Seeding the 8 core habit categories...');

  for (const category of coreCategories) {
    // upsert searches by name: if it already exists, it does nothing; if it doesn't exist, it creates it.
    await prisma.habitCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('✅ Habit categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding the database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });