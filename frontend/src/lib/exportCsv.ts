import type { Transaction } from "@/services/api";

const escapeCsvCell = (value: string): string =>
  /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/**
 * Builds a UTF-8 (BOM) CSV of transactions, reimportable by the app's own
 * CSV importer (comma separator, ISO dates, dot decimals).
 */
export const buildTransactionsCsv = (transactions: Transaction[]): string => {
  const header = ["date", "title", "type", "amount", "category", "method", "isFixed"];

  const rows = transactions.map((tx) =>
    [
      tx.date.split("T")[0],
      tx.title,
      tx.type,
      String(tx.amount),
      tx.category,
      tx.method,
      tx.isFixed ? "sim" : "nao"
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
