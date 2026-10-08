/**
 * Finora — Database Seed
 *
 * Creates:
 *  - 1 dev user (MVP: single-user, no auth)
 *  - 10 system categories (isSystem=true, not deletable via UI)
 *    including "Receitas" (isIncome=true)
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import { SYSTEM_CATEGORIES } from "../src/config/system-categories";

const prisma = new PrismaClient();

// ─── Dev user ────────────────────────────────────────────────────────────────
const DEV_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Dev User",
  email: "dev@finora.local",
};

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
