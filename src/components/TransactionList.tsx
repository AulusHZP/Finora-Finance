import { ShoppingBag, Car, Utensils, Briefcase, Zap, Heart, Gamepad2, DollarSign } from "lucide-react";

const iconMap: Record<string, any> = {
  Shopping: ShoppingBag,
  Transport: Car,
  Food: Utensils,
  Salary: Briefcase,
  Bills: Zap,
  Health: Heart,
  Entertainment: Gamepad2,
  Freelance: DollarSign,
};

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  date: string;
}

const transactions: Transaction[] = [
  { id: "1", title: "Grocery Store", category: "Food", amount: -82.50, type: "expense", date: "Today" },
  { id: "2", title: "Salary Deposit", category: "Salary", amount: 4500.00, type: "income", date: "Today" },
  { id: "3", title: "Electric Bill", category: "Bills", amount: -145.00, type: "expense", date: "Yesterday" },
  { id: "4", title: "Uber Ride", category: "Transport", amount: -24.30, type: "expense", date: "Yesterday" },
  { id: "5", title: "Freelance Project", category: "Freelance", amount: 1200.00, type: "income", date: "Mar 12" },
  { id: "6", title: "Nike Store", category: "Shopping", amount: -189.99, type: "expense", date: "Mar 11" },
  { id: "7", title: "Gym Membership", category: "Health", amount: -49.99, type: "expense", date: "Mar 10" },
  { id: "8", title: "Netflix", category: "Entertainment", amount: -15.99, type: "expense", date: "Mar 10" },
];

export function TransactionList({ limit }: { limit?: number }) {
  const items = limit ? transactions.slice(0, limit) : transactions;
  let lastDate = "";

  return (
    <div className="space-y-1">
      {items.map((tx) => {
        const Icon = iconMap[tx.category] || DollarSign;
        const showDate = tx.date !== lastDate;
        lastDate = tx.date;

        return (
          <div key={tx.id}>
            {showDate && (
              <p className="text-xs font-medium text-muted-foreground pt-4 pb-2 first:pt-0">{tx.date}</p>
            )}
            <div className="flex items-center gap-3.5 py-3 px-1 rounded-xl hover:bg-hover transition-default cursor-pointer press-scale">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                tx.type === "income" ? "bg-success-light" : "bg-muted"
              }`}>
                <Icon className={`h-4.5 w-4.5 ${tx.type === "income" ? "text-success" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{tx.title}</p>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-tag text-tag-foreground mt-0.5">
                  {tx.category}
                </span>
              </div>
              <p className={`text-sm font-semibold flex-shrink-0 ${
                tx.type === "income" ? "text-success" : "text-foreground"
              }`}>
                {tx.type === "income" ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
