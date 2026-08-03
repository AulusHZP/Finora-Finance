const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Resolving failed migrations...');
  try {
    await prisma.$executeRawUnsafe(`
      UPDATE "_prisma_migrations" 
      SET "rolled_back_at" = NOW() 
      WHERE "migration_name" IN ('20260801000000_clean_schema_rebuild', '20260803000000_restore_auth') 
      AND "rolled_back_at" IS NULL
    `);
    console.log('Successfully marked migrations as rolled back.');
  } catch (err) {
    console.error('Failed to update migrations table, this might be because it does not exist yet:', err.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
