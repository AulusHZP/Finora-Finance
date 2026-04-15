import { useState } from "react";
import { X, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
}

const categories = ["Food", "Transport", "Shopping", "Bills", "Salary", "Freelance", "Entertainment", "Health"];
const methods = ["Credit", "Debit", "Pix", "Cash", "Transfer"];

export function AddTransactionSheet({ open, onClose }: AddTransactionSheetProps) {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState("Credit");

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 pb-10 animate-slide-up lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:max-w-lg lg:w-full lg:pb-6 lg:shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">New Transaction</h2>
          <button onClick={onClose} className="h-7 w-7 rounded-full bg-muted flex items-center justify-center press-scale">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-2 mb-5">
          <button onClick={() => setType("expense")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-default press-scale ${type === "expense" ? "bg-error/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
            <ArrowUpRight className="h-4 w-4" /> Expense
          </button>
          <button onClick={() => setType("income")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-default press-scale ${type === "income" ? "bg-success-light text-success" : "bg-muted text-muted-foreground"}`}>
            <ArrowDownLeft className="h-4 w-4" /> Income
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">$</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full h-10 pl-7 pr-3 bg-muted rounded-lg text-foreground text-base font-semibold placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default" autoFocus />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this for?" className="w-full h-10 px-3 bg-muted rounded-lg text-foreground text-sm placeholder:text-disabled-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-medium transition-default press-scale ${category === cat ? "bg-primary text-primary-foreground" : "bg-tag text-tag-foreground hover:bg-hover"}`}>{cat}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Payment Method</label>
            <div className="flex flex-wrap gap-1.5">
              {methods.map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={`px-3 py-1 rounded-full text-xs font-medium transition-default press-scale ${method === m ? "bg-primary text-primary-foreground" : "bg-tag text-tag-foreground hover:bg-hover"}`}>{m}</button>
              ))}
            </div>
          </div>

          <button className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm press-scale hover:opacity-90 transition-default mt-1" onClick={onClose}>
            Add Transaction
          </button>
        </div>
      </div>
    </>
  );
}
