import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddTransactionModal } from "./AddTransactionModal";
import { categoryAPI, transactionAPI, type Category, type Transaction } from "@/services/api";

vi.mock("@/services/api", () => ({
  categoryAPI: { list: vi.fn() },
  transactionAPI: { create: vi.fn(), update: vi.fn() },
}));

const categories: Category[] = [
  { id: "food", name: "Comidas", icon: "utensils", color: "#F59E0B", isIncome: false, isSystem: true, createdAt: "" },
  { id: "shopping", name: "Compras", icon: "shopping-bag", color: "#EC4899", isIncome: false, isSystem: true, createdAt: "" },
  { id: "other", name: "Outros", icon: "tag", color: "#64748B", isIncome: false, isSystem: true, createdAt: "" },
  { id: "income", name: "Receitas", icon: "trending-up", color: "#10B981", isIncome: true, isSystem: true, createdAt: "" },
];
const transaction: Transaction = {
  id: "tx-1", userId: "user-1", categoryId: "shopping", category: categories[1],
  description: "Compra original", amount: 1234.56, date: "2026-10-07", createdAt: "",
};

describe("AddTransactionModal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(categoryAPI.list).mockResolvedValue(categories);
    vi.mocked(transactionAPI.update).mockResolvedValue(transaction);
  });

  it("preserves the original category after loading and updates all edited fields without creating another transaction", async () => {
    let resolveCategories!: (value: Category[]) => void;
    vi.mocked(categoryAPI.list).mockReturnValue(new Promise((resolve) => { resolveCategories = resolve; }));
    const onSaved = vi.fn();
    const onClose = vi.fn();
    render(<AddTransactionModal open onSaved={onSaved} onClose={onClose} transaction={transaction} />);

    expect(screen.getByLabelText("Descrição")).toHaveValue("Compra original");
    expect(screen.getByLabelText("Valor (R$)")).toHaveValue("1234,56");
    expect(screen.getByLabelText("Data")).toHaveValue("2026-10-07");
    await act(async () => resolveCategories(categories));
    expect(screen.getByLabelText("Categoria")).toHaveValue("shopping");

    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Compra corrigida" } });
    fireEvent.change(screen.getByLabelText("Valor (R$)"), { target: { value: "1.350,90" } });
    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2026-09-30" } });
    fireEvent.change(screen.getByLabelText("Categoria"), { target: { value: "other" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(transactionAPI.update).toHaveBeenCalledWith("tx-1", {
      description: "Compra corrigida", amount: 1350.9, date: "2026-09-30", categoryId: "other",
    });
    expect(transactionAPI.create).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps the form open and retains edits when saving fails", async () => {
    vi.mocked(transactionAPI.update).mockRejectedValue(new Error("Falha ao salvar"));
    const onClose = vi.fn();
    const onSaved = vi.fn();
    render(<AddTransactionModal open onClose={onClose} onSaved={onSaved} transaction={transaction} />);
    await waitFor(() => expect(screen.getByLabelText("Categoria")).toHaveValue("shopping"));
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Correção" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha ao salvar");
    expect(screen.getByLabelText("Descrição")).toHaveValue("Correção");
    expect(onClose).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("resets edit values when reopening for creation and supports both new categories", async () => {
    const props = { onClose: vi.fn(), onSaved: vi.fn() };
    const { rerender } = render(<AddTransactionModal {...props} open transaction={transaction} />);
    await waitFor(() => expect(screen.getByLabelText("Categoria")).toHaveValue("shopping"));
    rerender(<AddTransactionModal {...props} open={false} transaction={transaction} />);
    rerender(<AddTransactionModal {...props} open />);
    await screen.findByRole("option", { name: "Outros" });
    expect(screen.getByRole("option", { name: "Compras" })).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toHaveValue("");
    expect(screen.getByLabelText("Valor (R$)")).toHaveValue("");
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Gasto novo" } });
    fireEvent.change(screen.getByLabelText("Valor (R$)"), { target: { value: "22,93" } });
    fireEvent.change(screen.getByLabelText("Categoria"), { target: { value: "shopping" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(transactionAPI.create).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: "shopping", description: "Gasto novo", amount: 22.93,
    })));
    expect(transactionAPI.update).not.toHaveBeenCalled();
  });
});
