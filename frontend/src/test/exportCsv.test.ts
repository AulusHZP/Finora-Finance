import { describe, it, expect } from "vitest";
import { buildTransactionsCsv } from "@/lib/exportCsv";
import type { Transaction } from "@/services/api";

const baseTx: Transaction = {
  id: "1",
  title: "Mercado",
  category: "Alimentação",
  amount: 150.5,
  type: "expense",
  isFixed: false,
  date: "2026-07-01T12:00:00.000Z",
  method: "Pix",
  userId: "u1",
  createdAt: "2026-07-01T12:00:00.000Z",
  updatedAt: "2026-07-01T12:00:00.000Z"
};

describe("buildTransactionsCsv", () => {
  it("builds a header plus one row per transaction", () => {
    const csv = buildTransactionsCsv([baseTx]);
    const lines = csv.replace("﻿", "").split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("date,title,type,amount,category,method,isFixed");
    expect(lines[1]).toBe("2026-07-01,Mercado,expense,150.5,Alimentação,Pix,nao");
  });

  it("starts with a UTF-8 BOM so Excel detects the encoding", () => {
    expect(buildTransactionsCsv([]).startsWith("﻿")).toBe(true);
  });

  it("escapes cells containing commas and quotes", () => {
    const csv = buildTransactionsCsv([
      { ...baseTx, title: 'Almoço, "extra"' }
    ]);
    const row = csv.replace("﻿", "").split("\n")[1];

    expect(row).toContain('"Almoço, ""extra"""');
  });
});
