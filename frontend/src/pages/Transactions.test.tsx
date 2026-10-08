import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import Transactions from "./Transactions";
import { transactionAPI, categoryAPI, type Category, type Transaction } from "@/services/api";

vi.mock("@/services/api", () => ({
  transactionAPI: { list: vi.fn(), update: vi.fn(), delete: vi.fn() },
  categoryAPI: { list: vi.fn() },
}));
vi.mock("@/components/AppLayout", () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/PeriodSelector", () => ({ PeriodSelector: () => null }));

const categories: Category[] = [
  { id: "food", name: "Comidas", icon: "utensils", color: "#F59E0B", isIncome: false, isSystem: true, createdAt: "" },
  { id: "shopping", name: "Compras", icon: "shopping-bag", color: "#EC4899", isIncome: false, isSystem: true, createdAt: "" },
  { id: "other", name: "Outros", icon: "tag", color: "#64748B", isIncome: false, isSystem: true, createdAt: "" },
];
const original: Transaction = {
  id: "tx-1", userId: "u1", categoryId: "food", category: categories[0],
  description: "Café", amount: 25.74, date: "2026-10-05", createdAt: "",
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(categoryAPI.list).mockResolvedValue(categories);
  vi.mocked(transactionAPI.list).mockResolvedValue([original]);
});

it("shows categories without expenses and refreshes the list and category filters after editing", async () => {
  render(<Transactions />);
  await screen.findByRole("button", { name: "Editar Café" });
  fireEvent.click(screen.getByRole("button", { name: "Compras", exact: true }));
  expect(screen.getByText("Nenhuma transação encontrada")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Outros", exact: true })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Todas" }));
  fireEvent.click(screen.getByRole("button", { name: "Editar Café" }));
  await waitFor(() => expect(screen.getByLabelText("Categoria")).toHaveValue("food"));
  fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Café corrigido" } });
  fireEvent.change(screen.getByLabelText("Categoria"), { target: { value: "shopping" } });
  const updated = { ...original, description: "Café corrigido", categoryId: "shopping", category: categories[1] };
  vi.mocked(transactionAPI.update).mockResolvedValue(updated);
  vi.mocked(transactionAPI.list).mockResolvedValue([updated]);
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
  await screen.findByRole("button", { name: "Editar Café corrigido" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(transactionAPI.list).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: "Compras", exact: true }));
  expect(screen.getByText("Café corrigido")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Comidas", exact: true }));
  expect(screen.getByText("Nenhuma transação encontrada")).toBeInTheDocument();
});
