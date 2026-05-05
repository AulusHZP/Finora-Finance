import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SubCategory = { name: string; emoji: string };
type MainCategory = {
  name: string;
  type: "income" | "expense";
  emoji: string;
  sub: SubCategory[];
};

const mainCategories: MainCategory[] = [
  {
    name: "Alimentação",
    type: "expense",
    emoji: "🍔",
    sub: [
      { name: "Mercado", emoji: "🛒" },
      { name: "Restaurante", emoji: "🍽️" },
      { name: "Delivery", emoji: "🛵" },
      { name: "Lanches", emoji: "🥪" },
      { name: "Padaria", emoji: "🥐" },
    ],
  },
  {
    name: "Transporte",
    type: "expense",
    emoji: "🚗",
    sub: [
      { name: "Combustível", emoji: "⛽" },
      { name: "Uber / App", emoji: "📱" },
      { name: "Transporte Público", emoji: "🚌" },
      { name: "Estacionamento", emoji: "🅿️" },
      { name: "Manutenção Veículo", emoji: "🔧" },
      { name: "Pedágio", emoji: "🛣️" },
    ],
  },
  {
    name: "Moradia",
    type: "expense",
    emoji: "🏠",
    sub: [
      { name: "Aluguel", emoji: "🔑" },
      { name: "Condomínio", emoji: "🏢" },
      { name: "Água", emoji: "💧" },
      { name: "Energia Elétrica", emoji: "⚡" },
      { name: "Gás", emoji: "🔥" },
      { name: "Internet", emoji: "📶" },
      { name: "Reforma / Manutenção", emoji: "🔨" },
    ],
  },
  {
    name: "Contas & Serviços",
    type: "expense",
    emoji: "📱",
    sub: [
      { name: "Celular", emoji: "📞" },
      { name: "Streaming", emoji: "🎬" },
      { name: "Assinaturas", emoji: "📋" },
      { name: "Seguro", emoji: "🛡️" },
      { name: "Academia", emoji: "💪" },
    ],
  },
  {
    name: "Saúde",
    type: "expense",
    emoji: "🏥",
    sub: [
      { name: "Farmácia", emoji: "💊" },
      { name: "Consulta Médica", emoji: "🩺" },
      { name: "Exames", emoji: "🔬" },
      { name: "Plano de Saúde", emoji: "🏥" },
      { name: "Odontológico", emoji: "🦷" },
      { name: "Psicólogo", emoji: "🧠" },
    ],
  },
  {
    name: "Entretenimento",
    type: "expense",
    emoji: "🎬",
    sub: [
      { name: "Cinema", emoji: "🎥" },
      { name: "Jogos", emoji: "🎮" },
      { name: "Shows / Eventos", emoji: "🎵" },
      { name: "Viagens", emoji: "✈️" },
      { name: "Hobbies", emoji: "🎨" },
    ],
  },
  {
    name: "Compras",
    type: "expense",
    emoji: "🛍️",
    sub: [
      { name: "Roupas", emoji: "👕" },
      { name: "Eletrônicos", emoji: "💻" },
      { name: "Casa & Decoração", emoji: "🛋️" },
      { name: "Presentes", emoji: "🎁" },
      { name: "Cosméticos", emoji: "💄" },
    ],
  },
  {
    name: "Educação",
    type: "expense",
    emoji: "📚",
    sub: [
      { name: "Mensalidade", emoji: "🏫" },
      { name: "Cursos Online", emoji: "💻" },
      { name: "Livros", emoji: "📖" },
      { name: "Material Escolar", emoji: "✏️" },
    ],
  },
  {
    name: "Finanças",
    type: "expense",
    emoji: "💳",
    sub: [
      { name: "Tarifas Bancárias", emoji: "🏦" },
      { name: "Juros / Multas", emoji: "📈" },
      { name: "Empréstimo", emoji: "💸" },
      { name: "Cartão de Crédito", emoji: "💳" },
    ],
  },
  {
    name: "Pets",
    type: "expense",
    emoji: "🐾",
    sub: [
      { name: "Ração", emoji: "🦴" },
      { name: "Veterinário", emoji: "🐶" },
      { name: "Banho & Tosa", emoji: "✂️" },
      { name: "Acessórios Pet", emoji: "🐱" },
    ],
  },
  {
    name: "Outros Gastos",
    type: "expense",
    emoji: "📦",
    sub: [
      { name: "Doações", emoji: "❤️" },
      { name: "Gastos Inesperados", emoji: "⚠️" },
      { name: "Impostos", emoji: "🧾" },
      { name: "Outros", emoji: "📎" },
    ],
  },
  // ─── INCOME ───────────────────────────────────────────────
  {
    name: "Salário",
    type: "income",
    emoji: "💼",
    sub: [
      { name: "Salário Fixo", emoji: "📅" },
      { name: "Bônus", emoji: "🎯" },
      { name: "Adiantamento", emoji: "⏩" },
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
      { name: "Serviços Avulsos", emoji: "🔧" },
    ],
  },
  {
    name: "Investimentos",
    type: "income",
    emoji: "📈",
    sub: [
      { name: "Dividendos", emoji: "💰" },
      { name: "Rendimento Poupança", emoji: "🏦" },
      { name: "Venda de Ativos", emoji: "📊" },
      { name: "Aluguel de Imóvel", emoji: "🏠" },
    ],
  },
  {
    name: "Outras Receitas",
    type: "income",
    emoji: "💵",
    sub: [
      { name: "Vendas", emoji: "🛒" },
      { name: "Presentes Recebidos", emoji: "🎁" },
      { name: "Reembolso", emoji: "↩️" },
      { name: "Outros", emoji: "📎" },
    ],
  },
];

async function main() {
  console.log("Seeding categories...");

  for (const cat of mainCategories) {
    let parent = await prisma.category.findFirst({
      where: { name: cat.name, parentId: null },
    });

    if (!parent) {
      parent = await prisma.category.create({
        data: { name: cat.name, type: cat.type, emoji: cat.emoji },
      });
    } else {
      // Update type and emoji on existing category
      await prisma.category.update({
        where: { id: parent.id },
        data: { type: cat.type, emoji: cat.emoji },
      });
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
      } else {
        await prisma.category.update({
          where: { id: existing.id },
          data: { type: cat.type, emoji: sub.emoji },
        });
      }
    }
  }

  // Migrate existing transactions that have a string category name
  console.log("Migrating existing transactions...");
  const txs = await prisma.transaction.findMany({ where: { categoryId: null } });
  let migrated = 0;
  for (const tx of txs) {
    // @ts-ignore — category was the old string field stored in DB before migration
    const catName: string | null = (tx as any).category ?? null;
    if (!catName) continue;
    const match = await prisma.category.findFirst({ where: { name: catName, parentId: null } });
    if (match) {
      await prisma.transaction.update({ where: { id: tx.id }, data: { categoryId: match.id } });
      migrated++;
    }
  }

  console.log(`Done! Migrated ${migrated} transactions.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());