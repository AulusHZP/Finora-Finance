import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { transactionAPI } from "@/services/api";
import { parseCurrencyInputBRL } from "@/lib/currency";
import { CategoryPicker } from "@/components/CategoryPicker";

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
  onTransactionAdded?: () => void;
}

const methods = ["Crédito", "Débito", "Pix", "Dinheiro", "Transferência"];

export function AddTransactionSheet({ open, onClose, onTransactionAdded }: AddTransactionSheetProps) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [method, setMethod] = useState("Crédito");
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState("2");
  const [isFixed, setIsFixed] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleSubmit = async () => {
    if (!amount || !description || !category || !method || !date) {
      setError("Preencha todos os campos");
      return;
    }

    // Prevent saving "Outro" without a custom category
    if (category === "Outro") {
      if (!customCategory.trim()) {
        setError("Informe o nome da categoria personalizada");
        return;
      }
    }

    const parsedAmount = parseCurrencyInputBRL(amount);
    if (parsedAmount === null || parsedAmount <= 0) {
      setError("Informe um valor valido maior que zero");
      return;
    }

    const parsedInstallmentCount = Number.parseInt(installmentCount, 10);
    if (isInstallment && (!Number.isFinite(parsedInstallmentCount) || parsedInstallmentCount < 2 || parsedInstallmentCount > 48)) {
      setError("Informe um numero de parcelas entre 2 e 48");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      // We always send the actual selected category to the backend
      // If they selected "Outro", we send "Outro". 
      // The custom text will be appended to the transaction description so it's not lost.
      const finalCategory = category;
      const finalTitle = category === "Outro" && customCategory.trim() 
        ? `${description} (${customCategory.trim()})`
        : description;

      console.log("Submitting transaction:", {
        title: finalTitle,
        amount: parsedAmount,
        type,
        isFixed,
        category: finalCategory,
        method,
        date,
        installmentCount: isInstallment ? parsedInstallmentCount : 1
      });

      await transactionAPI.createTransaction({
        title: finalTitle,
        amount: parsedAmount,
        type,
        isFixed,
        category: finalCategory,
        method,
        date,
        installmentCount: isInstallment ? parsedInstallmentCount : 1
      });

      // Reset form
      setAmount("");
      setDescription("");
      setCategory("");
      setCustomCategory("");
      setMethod("Crédito");
      setIsInstallment(false);
      setInstallmentCount("2");
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

  return createPortal(
    <>
      <div className="fixed inset-0 bg-foreground/20 z-[999] animate-fade-in" onClick={onClose} role="button" tabIndex={-1} onKeyDown={(e) => e.key === "Escape" && onClose()} />
      <div className="fixed bottom-0 left-0 right-0 z-[999] bg-card rounded-t-3xl p-4 pb-6 animate-slide-up max-h-[95vh] overflow-y-auto lg:bottom-auto lg:left-1/2 lg:right-auto lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:max-w-lg lg:w-full lg:max-h-[95vh] lg:p-5 lg:shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Nova Transação</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center press-scale hover:bg-muted/80 transition-default flex-shrink-0">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <button onClick={() => setType("expense")} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm font-medium transition-default press-scale ${type === "expense" ? "bg-error/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
            <ArrowUpRight className="h-4 w-4" /> Despesa
          </button>
          <button onClick={() => setType("income")} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-sm font-medium transition-default press-scale ${type === "income" ? "bg-success-light text-success" : "bg-muted text-muted-foreground"}`}>
            <ArrowDownLeft className="h-4 w-4" /> Receita
          </button>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-0.5 block">Valor</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-base pointer-events-none">R$</span>
              <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="w-full h-9 pl-11 pr-3 bg-muted rounded-lg text-foreground text-base font-semibold placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default" autoFocus />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-0.5 block">Descrição</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Para que foi?" className="w-full h-9 px-3 bg-muted rounded-lg text-foreground text-sm placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-0.5 block">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-9 px-3 bg-muted rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-0.5 block">Categoria</label>
            <CategoryPicker
              value={category}
              onChange={(value) => {
                setCategory(value);
                if (value !== "Outros") {
                  setCustomCategory("");
                }
              }}
              type={type}
            />
          </div>

          {category === "Outro" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-0.5 block">Especifique a categoria</label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Ex: Areia para gato, Doação, etc"
                className="w-full h-9 px-3 bg-muted rounded-lg text-foreground text-sm placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-0.5 block">Método de Pagamento</label>
            <div className="flex flex-wrap gap-1.5">
              {methods.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMethod(m);
                    if (m !== "Crédito") {
                      setIsInstallment(false);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-default press-scale ${method === m ? "bg-primary text-primary-foreground" : "bg-tag text-tag-foreground hover:bg-hover"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {method === "Crédito" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-0.5 block">Compra parcelada?</label>
              <div className="flex gap-1.5 mb-1.5">
                <button
                  type="button"
                  onClick={() => setIsInstallment(false)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-default press-scale ${!isInstallment ? "bg-primary text-primary-foreground" : "bg-tag text-tag-foreground hover:bg-hover"}`}
                >
                  Nao
                </button>
                <button
                  type="button"
                  onClick={() => setIsInstallment(true)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-default press-scale ${isInstallment ? "bg-primary text-primary-foreground" : "bg-tag text-tag-foreground hover:bg-hover"}`}
                >
                  Sim
                </button>
              </div>

              {isInstallment && (
                <input
                  type="number"
                  min={2}
                  max={48}
                  step={1}
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(e.target.value)}
                  placeholder="Numero de parcelas"
                  className="w-full h-9 px-3 bg-muted rounded-lg text-foreground text-sm placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
                />
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-0.5 block">Tag</label>
            <button
              type="button"
              onClick={() => setIsFixed((prev) => !prev)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-default press-scale ${isFixed ? "bg-primary text-primary-foreground" : "bg-tag text-tag-foreground hover:bg-hover"}`}
            >
              Custo Fixo
            </button>
          </div>

          {error && (
            <div className="p-2.5 bg-error/10 text-destructive rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <button className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm press-scale hover:opacity-90 transition-default mt-1 disabled:opacity-50" onClick={handleSubmit} disabled={loading}>
            {loading ? "Adicionando..." : "Adicionar Transação"}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="w-full h-9 mt-1 bg-muted text-foreground rounded-lg font-medium text-sm press-scale hover:bg-muted/80 transition-default"
          >
            Cancelar
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
