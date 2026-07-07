import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, RefreshCw, TrendingUp, TrendingDown, ArrowRight, AlertCircle } from "lucide-react";
import { balanceAPI } from "@/services/api";
import { formatCurrencyBRL, parseCurrencyInputBRL } from "@/lib/currency";

interface BalanceAdjustSheetProps {
  open: boolean;
  onClose: () => void;
  /** Total balance (including goal reserves) — what the bank account should show. */
  currentBalance: number;
  currentOffset: number;
  reservedInGoals?: number;
}

export function BalanceAdjustSheet({ open, onClose, currentBalance, currentOffset, reservedInGoals = 0 }: BalanceAdjustSheetProps) {
  const [newBalance, setNewBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setNewBalance("");
      setError("");
      setSuccess(false);
    }
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const parsedNewBalance = parseCurrencyInputBRL(newBalance);
  const isValidInput = parsedNewBalance !== null && parsedNewBalance >= 0;
  const difference = isValidInput ? parsedNewBalance - currentBalance : 0;
  const absDifference = Math.abs(difference);
  const isIncrease = difference > 0;
  const noChange = difference === 0 && isValidInput;

  const handleSubmit = async () => {
    if (!isValidInput) {
      setError("Informe um valor válido (zero ou maior)");
      return;
    }

    if (noChange) {
      setError("O saldo informado é igual ao saldo atual");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Calculate the new offset: current offset + the difference between desired and current balance
      const newOffset = currentOffset + difference;

      await balanceAPI.updateBalanceOffset(newOffset);

      setSuccess(true);

      // Auto-close after a brief success animation
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao ajustar saldo";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-[2px] z-[999] animate-fade-in"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[999] bg-card rounded-t-3xl p-5 pb-8 animate-slide-up max-h-[95vh] overflow-y-auto lg:bottom-auto lg:left-1/2 lg:right-auto lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:max-w-md lg:w-full lg:max-h-[95vh] lg:p-6 lg:shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <RefreshCw className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Atualizar Saldo</h2>
              <p className="text-xs text-muted-foreground">Sincronize com o valor real do banco</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-muted flex items-center justify-center press-scale hover:bg-muted/80 transition-default flex-shrink-0"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {success ? (
          /* Success State */
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-success/15 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" className="animate-check-draw" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-foreground">Saldo atualizado!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Seu saldo agora é {formatCurrencyBRL(parsedNewBalance!)}
            </p>
          </div>
        ) : (
          <>
            {/* Current Balance Display */}
            <div className="bg-muted/60 rounded-xl p-4 mb-4">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo atual no app</span>
              <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground mt-1">
                {formatCurrencyBRL(currentBalance)}
              </p>
              {reservedInGoals > 0 && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Inclui {formatCurrencyBRL(reservedInGoals)} guardados em metas — compare com o saldo total do banco.
                </p>
              )}
            </div>

            {/* New Balance Input */}
            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Saldo real no banco
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-base pointer-events-none">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={newBalance}
                  onChange={(e) => {
                    setNewBalance(e.target.value);
                    setError("");
                  }}
                  placeholder="0,00"
                  className="w-full h-12 pl-12 pr-4 bg-muted rounded-xl text-foreground text-xl font-bold placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-default"
                  autoFocus
                />
              </div>
            </div>

            {/* Difference Preview */}
            {isValidInput && !noChange && (
              <div
                className={`rounded-xl p-4 mb-4 border transition-all duration-300 ${
                  isIncrease
                    ? "bg-success/5 border-success/20"
                    : "bg-destructive/5 border-destructive/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isIncrease ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {isIncrease ? "Adição ao saldo" : "Redução do saldo"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground tabular-nums">
                    {formatCurrencyBRL(currentBalance)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {formatCurrencyBRL(parsedNewBalance!)}
                  </span>
                </div>

                <p className={`text-sm font-bold mt-2 tabular-nums ${isIncrease ? "text-success" : "text-destructive"}`}>
                  {isIncrease ? "+" : "-"}{formatCurrencyBRL(absDifference)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Este ajuste é invisível — não aparece como transação nem afeta seus gastos.
                </p>
              </div>
            )}

            {noChange && (
              <div className="rounded-xl p-3 mb-4 bg-muted/60 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">
                  O valor informado é igual ao saldo atual — nenhum ajuste necessário.
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-error/10 text-destructive rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <button
              className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-medium text-sm press-scale hover:opacity-90 transition-default disabled:opacity-50 flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={loading || !isValidInput || noChange}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Ajustando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Atualizar Saldo
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-9 mt-2 bg-muted text-foreground rounded-xl font-medium text-sm press-scale hover:bg-muted/80 transition-default"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </>,
    document.body
  );
}
