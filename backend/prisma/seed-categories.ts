import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SubCategory = { name: string; emoji: string };
type MainCategory = {
  name: string;
  type: "income" | "expense";
  emoji: string;
  sub: SubCategory[];
};

const categories: MainCategory[] = [
  {
    name: "Alimentação",
    type: "expense",
    emoji: "🛒",
    sub: [
      { name: "Mercado", emoji: "🛒" },
      { name: "Restaurante", emoji: "🍽️" },
      { name: "Delivery", emoji: "🛵" },
      { name: "Café / Lanches", emoji: "☕" },
    ],
  },
  {
    name: "Compras",
    type: "expense",
    emoji: "🛍️",
    sub: [
      { name: "Roupas", emoji: "👕" },
      { name: "Eletrônicos", emoji: "💻" },
      { name: "Casa", emoji: "🏠" },
      { name: "Acessórios", emoji: "⌚" },
      { name: "Presentes", emoji: "🎁" },
    ],
  },
  {
    name: "Comida",
    type: "expense",
    emoji: "🍔",
    sub: [
      { name: "Fast Food", emoji: "🍟" },
      { name: "Almoço", emoji: "🍛" },
      { name: "Jantar", emoji: "🥘" },
      { name: "Doces", emoji: "🍰" },
      { name: "Bebidas", emoji: "🥤" },
    ],
  },
  {
    name: "Transporte",
    type: "expense",
    emoji: "🚗",
    sub: [
      { name: "Transporte público", emoji: "🚌" },
      { name: "Combustível", emoji: "⛽" },
      { name: "Uber / Taxi", emoji: "📱" },
      { name: "Estacionamento", emoji: "🅿️" },
      { name: "Manutenção", emoji: "🔧" },
    ],
  },
  // ─── INCOME ───
  {
    name: "Salário",
    type: "income",
    emoji: "💼",
    sub: [
      { name: "Salário Fixo", emoji: "📅" },
      { name: "Bônus", emoji: "🎯" },
      { name: "13º Salário", emoji: "🎄" },
    ],
  },
  {
    name: "Freelance",
    type: "income",
    emoji: "💻",
    sub: [
      { name: "Projetos", emoji: "🚀" },
      { name: "Consultoria", emoji: "🤝" },
    ],
  },
  {
    name: "Outras Receitas",
    type: "income",
    emoji: "💵",
    sub: [
      { name: "Vendas", emoji: "🛒" },
      { name: "Reembolso", emoji: "↩️" },
      { name: "Investimentos", emoji: "📈" },
    ],
  },
];

async function main() {
  console.log("🔄 Limpando categorias antigas...");
  // Remove orphan subcategories whose parent is no longer in our list
  // But keep all existing to avoid breaking references — just upsert

  console.log("🌱 Seeding categories...");

  for (const cat of categories) {
    let parent = await prisma.category.findFirst({
      where: { name: cat.name, parentId: null },
    });

    if (!parent) {
      parent = await prisma.category.create({
        data: { name: cat.name, type: cat.type, emoji: cat.emoji },
      });
      console.log(`  ✅ Created: ${cat.emoji} ${cat.name}`);
    } else {
      await prisma.category.update({
        where: { id: parent.id },
        data: { type: cat.type, emoji: cat.emoji },
      });
      console.log(`  ♻️ Updated: ${cat.emoji} ${cat.name}`);
    }

    for (const sub of cat.sub) {
      const existing = await prisma.category.findFirst({
        where: { name: sub.name, parentId: parent.id },
      });
      if (!existing) {
        await prisma.category.create({
          data: {
            name: sub.name,
            type: cat.type,
            emoji: sub.emoji,
            parentId: parent.id,
          },
        });
        console.log(`    + ${sub.emoji} ${sub.name}`);
      } else {
        await prisma.category.update({
          where: { id: existing.id },
          data: { type: cat.type, emoji: sub.emoji },
        });
      }
    }
  }

  // Migrate transactions with null categoryId
  console.log("\n🔗 Migrating transactions...");
  const txs = await prisma.transaction.findMany({ where: { categoryId: null } });
  let migrated = 0;
  for (const tx of txs) {
    const catName: string | null = (tx as any).category ?? null;
    if (!catName) continue;
    const match = await prisma.category.findFirst({ where: { name: catName } });
    if (match) {
      await prisma.transaction.update({ where: { id: tx.id }, data: { categoryId: match.id } });
      migrated++;
    }
  }

  console.log(`\n✅ Done! Migrated ${migrated} transactions.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());