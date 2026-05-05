import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { categorizeAPI, type Category } from "@/services/api";

interface Props {
  value: string;
  onChange: (value: string) => void;
  type?: "income" | "expense";
}

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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!type) return categories;
    return categories.filter((c) => (c as any).type === type);
  }, [categories, type]);

  const handleSelect = (categoryName: string) => {
    onChange(categoryName);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default flex items-center justify-between border border-transparent"
      >
        <span className={value ? "text-foreground truncate" : "text-muted-foreground truncate"}>
          {value || "Selecione uma categoria..."}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto py-1.5 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground text-center">Nenhuma categoria encontrada</div>
          ) : (
            filtered.map((cat) => (
              <div key={cat.id} className="mb-1 last:mb-0">
                {/* Main Category */}
                <button
                  type="button"
                  onClick={() => handleSelect(cat.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-muted ${
                    value === cat.name ? "text-primary font-semibold bg-primary/5" : "text-foreground font-medium"
                  }`}
                >
                  <span className="truncate pr-2">{cat.name}</span>
                  {value === cat.name && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
                
                {/* Subcategories */}
                {cat.subcategories?.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelect(sub.name)}
                    className={`w-full flex items-center justify-between pl-6 pr-3 py-1.5 text-sm transition-colors hover:bg-muted ${
                      value === sub.name ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="truncate pr-2">{sub.name}</span>
                    {value === sub.name && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
