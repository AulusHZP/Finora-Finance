import { useState } from "react";
import { X, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { transactionAPI } from "@/services/api";
import { parseCurrencyInputBRL } from "@/lib/currency";

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
  onTransactionAdded?: () => void;
}

const categories = ["Alimentação", "Transporte", "Compras", "Contas", "Salário", "Freelance", "Entretenimento", "Saúde"];
const methods = ["Crédito", "Débito", "Pix", "Dinheiro", "Transferência"];

export function AddTransactionSheet({ open, onClose, onTransactionAdded }: AddTransactionSheetProps) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState("Crédito");
  const [isFixed, setIsFixed] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!amount || !description || !category || !method || !date) {
      setError("Preencha todos os campos");
      return;
    }

    const parsedAmount = parseCurrencyInputBRL(amount);
    if (parsedAmount === null || parsedAmount <= 0) {
      setError("Informe um valor valido maior que zero");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      console.log("Submitting transaction:", {
        title: description,
        amount: parsedAmount,
        type,
        isFixed,
        category,
        method,
        date
      });

      await transactionAPI.createTransaction({
        title: description,
        amount: parsedAmount,
        type,
        isFixed,
        category,
        method,
        date
      });

      // Reset form
      setAmount("");
      setDescription("");
      setCategory("");
      setMethod("Crédito");
      setIsFixed(false);
      setDate(new Date().toISOString().split('T')[0]);
      setType("expense");
      
      onTransactionAdded?.();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao adicionar transação";
      console.error("Transaction submission error:", errorMsg, err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 pb-10 animate-slide-up lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:max-w-lg lg:w-full lg:pb-6 lg:shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">Nova Transação</h2>
          <button onClick={onClose} className="h-7 w-7 rounded-full bg-muted flex items-center justify-center press-scale">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-2 mb-5">
          <button onClick={() => setType("expense")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-default press-scale ${type === "expense" ? "bg-error/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
            <ArrowUpRight className="h-4 w-4" /> Despesa
          </button>
          <button onClick={() => setType("income")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-default press-scale ${type === "income" ? "bg-success-light text-success" : "bg-muted text-muted-foreground"}`}>
            <ArrowDownLeft className="h-4 w-4" /> Receita
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Valor</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">R$</span>
              <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="w-full h-10 pl-7 pr-3 bg-muted rounded-lg text-foreground text-base font-semibold placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default" autoFocus />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Para que foi?" className="w-full h-10 px-3 bg-muted rounded-lg text-foreground text-sm placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Categoria</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-medium transition-default press-scale ${category === cat ? "bg-primary text-primary-foreground" : "bg-tag text-tag-foreground hover:bg-hover"}`}>{cat}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Método de Pagamento</label>
            <div className="flex flex-wrap gap-1.5">
              {methods.map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={`px-3 py-1 rounded-full text-xs font-medium transition-default press-scale ${method === m ? "bg-primary text-primary-foreground" : "bg-tag text-tag-foreground hover:bg-hover"}`}>{m}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tag</label>
            <button
              type="button"
              onClick={() => setIsFixed((prev) => !prev)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-default press-scale ${isFixed ? "bg-primary text-primary-foreground" : "bg-tag text-tag-foreground hover:bg-hover"}`}
            >
              Custo Fixo
            </button>
          </div>

          {error && (
            <div className="p-3 bg-error/10 text-destructive rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <button className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm press-scale hover:opacity-90 transition-default mt-1 disabled:opacity-50" onClick={handleSubmit} disabled={loading}>
            {loading ? "Adicionando..." : "Adicionar Transação"}
          </button>
        </div>
      </div>
    </>
  );
}
