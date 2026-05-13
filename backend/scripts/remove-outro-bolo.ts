import { prisma } from "../src/config/prisma";

async function removeDuplicatedOutroAndBolo() {
  console.log("🧹 Removendo categorias 'Outro' e 'Bolo'...");

  // Delete Bolo
  const bolo = await prisma.category.findMany({
    where: { name: "Bolo" }
  });

  for (const c of bolo) {
    console.log(`Removendo: ${c.name}`);
    // First remove link from transactions
    await prisma.transaction.updateMany({
      where: { categoryId: c.id },
      data: { categoryId: null } 
    });
    await prisma.category.delete({ where: { id: c.id } });
  }

  // Delete Outro
  const outro = await prisma.category.findMany({
    where: { name: "Outro" }
  });

  for (const c of outro) {
    console.log(`Removendo: ${c.name}`);
    await prisma.transaction.updateMany({
      where: { categoryId: c.id },
      data: { categoryId: null } 
    });
    // First remove subcategories to avoid foreign key constraints
    await prisma.category.deleteMany({
      where: { parentId: c.id }
    });
    await prisma.category.delete({ where: { id: c.id } });
  }

  console.log("✅ Concluído");
}

removeDuplicatedOutroAndBolo()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro:", error);
    process.exit(1);
  });
