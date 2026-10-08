import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTransactionsByUserId, createTransaction, updateTransaction, getSpentByCategoryForMonth } from "./transaction.service";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/http-error";

vi.mock("../config/prisma", () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Transaction Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTransactionsByUserId", () => {
    it("should fetch all transactions for a user", async () => {
      const mockTxs = [{ id: "tx1", userId: "u1" }];
      vi.mocked(prisma.transaction.findMany).mockResolvedValue(mockTxs as any);

      const result = await getTransactionsByUserId("u1");

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: "u1" },
        include: { category: expect.any(Object) },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      });
      expect(result).toEqual(mockTxs);
    });

    it("should apply year, month and categoryId filters", async () => {
      vi.mocked(prisma.transaction.findMany).mockResolvedValue([] as any);

      await getTransactionsByUserId("u1", { year: 2024, month: 2, categoryId: "c1" });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId: "u1",
          date: { gte: "2024-02-01", lt: "2024-03-01" },
          categoryId: "c1",
        },
        include: { category: expect.any(Object) },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      });
    });
  });

  describe("createTransaction", () => {
    it("should throw if amount is negative", async () => {
      await expect(
        createTransaction("u1", { categoryId: "c1", description: "Test", amount: -10, date: "2024-01-01" })
      ).rejects.toThrow(new HttpError(400, "O valor deve ser positivo"));
    });

    it("should throw if date is invalid format", async () => {
      await expect(
        createTransaction("u1", { categoryId: "c1", description: "Test", amount: 10, date: "01/01/2024" })
      ).rejects.toThrow(new HttpError(400, "Data inválida. Use o formato YYYY-MM-DD"));
    });

    it("should throw if category not found", async () => {
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);

      await expect(
        createTransaction("u1", { categoryId: "c1", description: "Test", amount: 10, date: "2024-01-01" })
      ).rejects.toThrow(new HttpError(404, "Categoria não encontrada"));
    });

    it("should create transaction successfully", async () => {
      vi.mocked(prisma.category.findFirst).mockResolvedValue({ id: "c1" } as any);
      vi.mocked(prisma.transaction.create).mockResolvedValue({ id: "tx1" } as any);

      const result = await createTransaction("u1", {
        categoryId: "c1",
        description: "   Test Desc   ",
        amount: 50.5,
        date: "2024-01-01",
      });

      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          userId: "u1",
          categoryId: "c1",
          description: "Test Desc",
          amount: 50.5,
          date: "2024-01-01",
        },
        include: { category: expect.any(Object) },
      });
      expect(result).toEqual({ id: "tx1" });
    });
  });

  describe("updateTransaction", () => {
    it("updates an existing transaction after validating ownership of the new category", async () => {
      vi.mocked(prisma.transaction.findFirst).mockResolvedValue({ id: "tx1", categoryId: "c1" } as any);
      vi.mocked(prisma.category.findFirst).mockResolvedValue({ id: "c2" } as any);
      const changes = { categoryId: "c2", description: "Compra corrigida", amount: 1350.9, date: "2026-09-30" };
      vi.mocked(prisma.transaction.update).mockResolvedValue({ id: "tx1", ...changes } as any);

      const result = await updateTransaction("tx1", "u1", changes);

      expect(prisma.transaction.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "tx1", userId: "u1" } }));
      expect(prisma.category.findFirst).toHaveBeenCalledWith({ where: { id: "c2", userId: "u1" } });
      expect(prisma.transaction.update).toHaveBeenCalledWith({ where: { id: "tx1" }, data: changes, include: { category: expect.any(Object) } });
      expect(result).toEqual({ id: "tx1", ...changes });
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });

    it("does not update transactions belonging to another user", async () => {
      vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null);
      await expect(updateTransaction("tx1", "u2", { amount: 20 })).rejects.toThrow("Transação não encontrada");
      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });

    it("does not reassign a transaction to another user's category", async () => {
      vi.mocked(prisma.transaction.findFirst).mockResolvedValue({ id: "tx1", categoryId: "c1" } as any);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
      await expect(updateTransaction("tx1", "u1", { categoryId: "foreign" })).rejects.toThrow("Categoria não encontrada");
      expect(prisma.transaction.update).not.toHaveBeenCalled();
    });
  });

  describe("getSpentByCategoryForMonth", () => {
    it("should correctly sum expenses by category", async () => {
      const mockRows = [
        { categoryId: "c1", amount: 100 },
        { categoryId: "c1", amount: 50 },
        { categoryId: "c2", amount: 200 },
      ];
      vi.mocked(prisma.transaction.findMany).mockResolvedValue(mockRows as any);

      const result = await getSpentByCategoryForMonth("u1", 2024, 2);

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId: "u1",
          date: { gte: "2024-02-01", lt: "2024-03-01" },
          category: { isIncome: false },
        },
        select: { categoryId: true, amount: true },
      });
      expect(result.get("c1")).toBe(150);
      expect(result.get("c2")).toBe(200);
      expect(result.size).toBe(2);
    });
  });
});
