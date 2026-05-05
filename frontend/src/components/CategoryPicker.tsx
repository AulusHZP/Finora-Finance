import { useState, useEffect, useMemo } from "react";
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

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const filtered = useMemo(() => {
    if (!type) return categories;
    return categories.filter((c) => (c as any).type === type);
  }, [categories, type]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default appearance-none cursor-pointer"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
    >
      <option value="" disabled>Selecione uma categoria...</option>
      {filtered.map((cat) => (
        <optgroup key={cat.id} label={`${(cat as any).emoji || "📁"} ${cat.name}`}>
          <option value={cat.name}>{cat.name} (Geral)</option>
          {cat.subcategories?.map((sub) => (
            <option key={sub.id} value={sub.name}>
              ↳ {(sub as any).emoji || "•"} {sub.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
