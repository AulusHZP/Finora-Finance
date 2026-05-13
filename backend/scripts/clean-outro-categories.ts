import { prisma } from "../src/config/prisma";

async function cleanOutroCategories() {
  console.log("🧹 Limpando categorias 'Outro:...'");

  // Find all categories that start with "Outro:"
  const outroCategoriesStarting = await prisma.category.findMany({
    where: {
      name: {
        startsWith: "Outro:"
      }
    }
  });

  console.log(`✅ Encontradas ${outroCategoriesStarting.length} categorias com prefixo "Outro:"`);

  for (const category of outroCategoriesStarting) {
    // Remove "Outro: " prefix
    const newName = category.name.replace(/^Outro:\s*/, "").trim();
    
    console.log(`\n📝 Processando: "${category.name}" → "${newName}"`);

    // Check if a category with the new name already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: newName,
        parentId: null
      }
    });

    if (existingCategory) {
      console.log(`   ℹ️  Categoria "${newName}" já existe, atualizando transações...`);
      
      // Update all transactions pointing to the old category to point to the existing one
      const updated = await prisma.transaction.updateMany({
        where: { categoryId: category.id },
        data: { categoryId: existingCategory.id }
      });

      console.log(`   ✓ ${updated.count} transações atualizadas`);

      // Delete the old category
      await prisma.category.delete({ where: { id: category.id } });
      console.log(`   🗑️  Categoria antiga removida`);
    } else {
      console.log(`   ✏️  Renomeando categoria para "${newName}"...`);
      
      // Rename the category
      await prisma.category.update({
        where: { id: category.id },
        data: { name: newName }
      });

      console.log(`   ✓ Categoria renomeada com sucesso`);
    }
  }

  console.log("\n✨ Limpeza concluída!");
}

cleanOutroCategories()
  .then(() => {
    console.log("\n✅ Script executado com sucesso");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro:", error);
    process.exit(1);
  });
