import { Plus } from "lucide-react";

interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-5 lg:bottom-8 lg:right-8 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center press-scale hover:shadow-xl hover:shadow-primary/30 transition-default"
      aria-label="Add transaction"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
