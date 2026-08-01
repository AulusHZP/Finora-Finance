/**
 * Finora — Database Seed
 *
 * Creates:
 *  - 1 dev user (MVP: single-user, no auth)
 *  - 9 system categories (isSystem=true, not deletable via UI)
 *    including "Receitas" (isIncome=true)
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Dev user ────────────────────────────────────────────────────────────────
const DEV_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Dev User",
  email: "dev@finora.local",
};

// ─── System categories ────────────────────────────────────────────────────────
// icon: Lucide icon name  |  color: hex  |  isIncome: only "Receitas"
const SYSTEM_CATEGORIES = [
  {
    name: "Receitas",
    icon: "trending-up",
    color: "#10B981",
    isIncome: true,
  },
  {
    name: "Alimentação",
    icon: "utensils",
    color: "#F59E0B",
    isIncome: false,
  },
  {
    name: "Transporte",
    icon: "car",
    color: "#3B82F6",
    isIncome: false,
  },
  {
    name: "Moradia",
    icon: "home",
    color: "#8B5CF6",
    isIncome: false,
  },
  {
    name: "Lazer",
    icon: "gamepad-2",
    color: "#F97316",
    isIncome: false,
  },
  {
    name: "Saúde",
    icon: "heart",
    color: "#EF4444",
    isIncome: false,
  },
  {
    name: "Educação",
    icon: "graduation-cap",
    color: "#06B6D4",
    isIncome: false,
  },
  {
    name: "Compras",
    icon: "shopping-bag",
    color: "#EC4899",
    isIncome: false,
  },
  {
    name: "Assinaturas",
    icon: "refresh-cw",
    color: "#6B7280",
    isIncome: false,
  },
] as const;

async function main() {
  console.log("🌱 Finora seed starting...\n");

  // ── 1. Upsert dev user ──────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { id: DEV_USER.id },
    create: DEV_USER,
    update: { name: DEV_USER.name },
  });
  console.log(`✅ User: ${user.name} (${user.email})`);

  // ── 2. Upsert system categories ─────────────────────────────────────────────
  console.log("\n📂 System categories:");
  for (const cat of SYSTEM_CATEGORIES) {
    const result = await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: cat.name } },
      create: {
        userId: user.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isSystem: true,
        isIncome: cat.isIncome,
      },
      update: {
        icon: cat.icon,
        color: cat.color,
        isSystem: true,
        isIncome: cat.isIncome,
      },
    });
    const badge = cat.isIncome ? "💚" : "📁";
    console.log(`  ${badge} ${result.name} (${result.color})`);
  }

  // ── 3. Ensure a MonthlyBudget exists for the current month ──────────────────
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed

  await prisma.monthlyBudget.upsert({
    where: { userId_year_month: { userId: user.id, year, month } },
    create: {
      userId: user.id,
      year,
      month,
      totalLimit: null,
      alertThreshold: 80,
    },
    update: {},
  });
  console.log(`\n📅 MonthlyBudget: ${year}-${String(month).padStart(2, "0")} ready`);

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
