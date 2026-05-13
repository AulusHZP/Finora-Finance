import { prisma } from "../src/config/prisma";

async function fixBoloCategory() {
  console.log("🛠 Corrigindo categorias personalizadas para ficarem dentro de 'Outro'");

  // Ensure "Outro" category exists
  let outroCategory = await prisma.category.findFirst({
    where: { name: "Outro", parentId: null }
  });

  if (!outroCategory) {
    outroCategory = await prisma.category.create({
      data: { name: "Outro", type: "expense", emoji: "📌" }
    });
    console.log("📌 Categoria 'Outro' criada!");
  } else {
    console.log("📌 Categoria 'Outro' já existe.");
  }

  // Find categories that don't have parentId and are not part of the default seed
  // For now, let's just specifically fix "Bolo" or any others that might exist.
  // We can just find "Bolo".
  const bolo = await prisma.category.findFirst({
    where: { name: "Bolo", parentId: null }
  });

  if (bolo) {
    await prisma.category.update({
      where: { id: bolo.id },
      data: { parentId: outroCategory.id }
    });
    console.log("✅ Categoria 'Bolo' movida para dentro de 'Outro'!");
  } else {
    console.log("✅ Categoria 'Bolo' não encontrada ou já movida.");
  }
}

fixBoloCategory()
  .then(() => {
    console.log("\n✅ Concluído");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro:", error);
    process.exit(1);
  });
