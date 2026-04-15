import { useState } from "react";
import { X, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
}

const categories = ["Food", "Transport", "Shopping", "Bills", "Salary", "Freelance", "Entertainment", "Health"];

export function AddTransactionSheet({ open, onClose }: AddTransactionSheetProps) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 pb-10 animate-slide-up lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl lg:max-w-md lg:w-full lg:pb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">New Transaction</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center press-scale">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setType("expense")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-default press-scale ${
              type === "expense" ? "bg-error/10 text-destructive" : "bg-muted text-muted-foreground"
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            Expense
          </button>
          <button
            onClick={() => setType("income")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-default press-scale ${
              type === "income" ? "bg-success-light text-success" : "bg-muted text-muted-foreground"
            }`}
          >
            <ArrowDownLeft className="h-4 w-4" />
            Income
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 pl-8 pr-4 bg-muted rounded-xl text-foreground text-lg font-semibold placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              className="w-full h-12 px-4 bg-muted rounded-xl text-foreground text-sm placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-default press-scale ${
                    category === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-tag text-tag-foreground hover:bg-hover"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <button
            className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium text-sm press-scale hover:opacity-90 transition-default mt-2"
            onClick={onClose}
          >
            Add Transaction
          </button>
        </div>
      </div>
    </>
  );
}
