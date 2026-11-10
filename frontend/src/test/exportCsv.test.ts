import { describe, it, expect } from "vitest";
import { buildTransactionsCsv } from "@/lib/exportCsv";
import type { Transaction } from "@/services/api";

const baseTx: Transaction = {
  id: "1",
  description: "Mercado",
  categoryId: "food",
  category: { id: "food", name: "Alimentação", icon: "utensils", color: "#fff", isIncome: false },
  amount: 150.5,
  date: "2026-07-01T12:00:00.000Z",
  userId: "u1",
  createdAt: "2026-07-01T12:00:00.000Z"
};

describe("buildTransactionsCsv", () => {
  it("builds a header plus one row per transaction", () => {
    const csv = buildTransactionsCsv([baseTx]);
    const lines = csv.replace("﻿", "").split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("date,description,amount,category");
    expect(lines[1]).toBe("2026-07-01,Mercado,150.5,Alimentação");
  });

  it("starts with a UTF-8 BOM so Excel detects the encoding", () => {
    expect(buildTransactionsCsv([]).startsWith("﻿")).toBe(true);
  });

  it("escapes cells containing commas and quotes", () => {
    const csv = buildTransactionsCsv([
      { ...baseTx, description: 'Almoço, "extra"' }
    ]);
    const row = csv.replace("﻿", "").split("\n")[1];

    expect(row).toContain('"Almoço, ""extra"""');
  });

  it("exports income with a negative amount for the default CSV import convention", () => {
    const csv = buildTransactionsCsv([{ ...baseTx, category: { ...baseTx.category, isIncome: true } }]);
    expect(csv).toContain("Mercado,-150.5,Alimentação");
  });
});
