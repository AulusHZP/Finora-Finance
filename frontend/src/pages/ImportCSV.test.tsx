import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import ImportCSV from "./ImportCSV";

vi.mock("@/components/AppLayout", () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

afterEach(() => vi.restoreAllMocks());

it("previews CSV rows locally and does not offer to import or delete transactions", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  const { container } = render(<ImportCSV />);
  expect(screen.getByRole("status")).toHaveTextContent("importação e a limpeza de transações via CSV estão indisponíveis");
  const input = container.querySelector('input[type="file"]');
  expect(input).not.toBeNull();
  const file = new File([
    "date,description,amount\n2026-11-10,Mercado,150\n2026-11-10,Mercado,150\n",
  ], "exemplo.csv", { type: "text/csv" });
  fireEvent.change(input!, { target: { files: [file] } });
  expect(await screen.findByRole("heading", { name: "Mapear Colunas" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continuar para Revisão" }));
  expect(screen.getByRole("heading", { name: "Revisar dados do arquivo" })).toBeInTheDocument();
  expect(screen.getByText(/1 transação válida no arquivo/)).toHaveTextContent("1 duplicada no arquivo");
  expect(screen.getAllByText("Mercado")).toHaveLength(2);
  expect(screen.queryByRole("button", { name: /^Importar/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Apagar transações/ })).not.toBeInTheDocument();
  expect(fetchSpy).not.toHaveBeenCalled();
});
