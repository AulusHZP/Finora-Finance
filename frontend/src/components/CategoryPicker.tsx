import { useState, useEffect, useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { categorizeAPI, type Category } from "@/services/api";

interface Props {
  value: string;
  onChange: (value: string) => void;
  type?: "income" | "expense";
}

// Cache categories at module level to avoid repeated API calls
let cachedCategories: Category[] | null = null;
let cachePromise: Promise<Category[]> | null = null;

const fetchCategories = (): Promise<Category[]> => {
  if (cachedCategories) return Promise.resolve(cachedCategories);
  if (cachePromise) return cachePromise;
  cachePromise = categorizeAPI.getCategories().then((data) => {
    cachedCategories = data ?? [];
    cachePromise = null;
    return cachedCategories;
  }).catch(() => {
    cachePromise = null;
    return [];
  });
  return cachePromise;
};

export function CategoryPicker({ value, onChange, type }: Props) {
  const [categories, setCategories] = useState<Category[]>(cachedCategories ?? []);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  // Filter categories by type (income/expense) if provided
  const filtered = useMemo(() => {
    if (!type) return categories;
    return categories.filter((c) => (c as any).type === type);
  }, [categories, type]);

  // If a value matches a subcategory, find which parent it belongs to
  const findParentOfSub = (name: string): Category | undefined => {
    return filtered.find((cat) =>
      cat.subcategories?.some((sub) => sub.name === name)
    );
  };

  // Show subcategories of the expanded parent
  if (expandedParent) {
    const parent = filtered.find((c) => c.name === expandedParent);
    if (!parent) return null;
    const subs = parent.subcategories ?? [];

    return (
      <div>
        <button
          type="button"
          onClick={() => setExpandedParent(null)}
          className="flex items-center gap-1 text-xs font-medium text-primary mb-2 hover:underline"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Voltar
        </button>
        <div className="flex flex-wrap gap-1.5">
          {/* Parent itself as option */}
          <button
            type="button"
            onClick={() => { onChange(parent.name); setExpandedParent(null); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all press-scale flex items-center gap-1.5 ${
              value === parent.name
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-foreground hover:bg-muted/80 border border-border/40"
            }`}
          >
            <span className="text-sm leading-none">{(parent as any).emoji || "📁"}</span>
            {parent.name} (Geral)
          </button>
          {subs.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => { onChange(sub.name); setExpandedParent(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all press-scale flex items-center gap-1.5 ${
                value === sub.name
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-tag text-tag-foreground hover:bg-hover"
              }`}
            >
              <span className="text-sm leading-none">{(sub as any).emoji || "•"}</span>
              {sub.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Show main categories
  return (
    <div className="flex flex-wrap gap-1.5">
      {filtered.map((cat) => {
        const hasSubs = cat.subcategories && cat.subcategories.length > 0;
        const isSelected = value === cat.name;
        // Also highlight parent if a sub is selected
        const childSelected = findParentOfSub(value)?.name === cat.name;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              if (hasSubs) {
                setExpandedParent(cat.name);
              } else {
                onChange(cat.name);
              }
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all press-scale flex items-center gap-1.5 ${
              isSelected || childSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-tag text-tag-foreground hover:bg-hover"
            }`}
          >
            <span className="text-sm leading-none">{(cat as any).emoji || "📁"}</span>
            {cat.name}
            {childSelected && !isSelected && (
              <span className="opacity-75 text-[10px]">• {value}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
