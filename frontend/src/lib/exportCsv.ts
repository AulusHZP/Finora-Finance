import type { Transaction } from "@/services/api";

const escapeCsvCell = (value: string): string =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/**
 * Builds a UTF-8 (BOM) CSV with comma separators and ISO dates.
 * Import does not currently preserve category names or multiline fields.
 */
export const buildTransactionsCsv = (transactions: Transaction[]): string => {
  // Amounts follow the importer's credit-card convention: expenses are
  // positive and income is negative. The current API stores both as positive
  // and uses the category to distinguish them.
  const header = ["date", "description", "amount", "category"];

  const rows = transactions.map((tx) =>
    [
      tx.date.split("T")[0],
      tx.description,
      String(tx.category.isIncome ? -tx.amount : tx.amount),
      tx.category.name,
    ]
      .map((cell) => escapeCsvCell(cell))
      .join(",")
  );

  return "﻿" + [header.join(","), ...rows].join("\n");
};

export const downloadCsv = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
