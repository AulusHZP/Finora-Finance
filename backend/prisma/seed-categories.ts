import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const mainCategories = [
  { name: "Alimentação", sub: ["Mercado", "Restaurante", "Delivery"] },
  { name: "Transporte", sub: ["Combustível", "Uber/App", "Transporte Público", "Manutenção"] },
  { name: "Compras", sub: ["Roupas", "Eletrônicos", "Presentes", "Outros"] },
  { name: "Contas", sub: ["Água", "Luz", "Internet", "Aluguel", "Celular"] },
  { name: "Salário", sub: ["Fixo", "Bônus", "Adiantamento"] },
  { name: "Freelance", sub: ["Projeto A", "Consultoria"] },
  { name: "Entretenimento", sub: ["Cinema", "Assinaturas", "Eventos"] },
  { name: "Saúde", sub: ["Farmácia", "Consulta", "Plano de Saúde"] }
];

async function main() {
  console.log("Seeding categories...");

  for (const cat of mainCategories) {
    let parent = await prisma.category.findFirst({ where: { name: cat.name, parentId: null } });
    if (!parent) {
      parent = await prisma.category.create({
        data: { name: cat.name },
      });
    }

    for (const subName of cat.sub) {
      let sub = await prisma.category.findFirst({ where: { name: subName, parentId: parent.id } });
      if (!sub) {
        await prisma.category.create({
          data: { name: subName, parentId: parent.id },
        });
      }
    }
  }

  // Migrate existing transactions:
  console.log("Migrating transactions...");
  const txs = await prisma.transaction.findMany();
  for (const tx of txs) {
    const parent = await prisma.category.findFirst({ where: { name: tx.category, parentId: null } });
    if (parent) {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { categoryId: parent.id }
      });
    }
  }
}

main().catch(console.error);