import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tx = await prisma.transaction.findFirst();
  if (!tx) { console.log("No tx"); return; }
  console.log("Before:", tx.category, tx.categoryId);
  
  // Try to update using service
  const { updateTransaction } = require('./src/services/transaction.service.ts');
  const updated = await updateTransaction(tx.id, tx.userId, { category: "Fast Food" });
  console.log("After:", updated.category, updated.categoryId);
}
main().catch(console.error).finally(() => prisma.$disconnect());
