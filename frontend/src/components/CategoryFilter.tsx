import { useState, useEffect, useRef } from "react";
import { ChevronDown, Tag, X, Folder, FolderOpen } from "lucide-react";
import { categorizeAPI, type Category } from "@/services/api";

interface Props {
  value: string;           // category name selected
  onChange: (value: string) => void;
}

export function CategoryFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    categorizeAPI.getCategories().then((data) => {
      if (!cancelled) setCategories(data ?? []);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const expenseCategories = categories.filter((c) => (c as any).type === "expense");
  const incomeCategories  = categories.filter((c) => (c as any).type === "income");

  const handleSelect = (name: string) => {
    onChange(value === name ? "" : name);
    setOpen(false);
  };

  const label = value || "Categorias";
  const hasFilter = Boolean(value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`h-9 flex items-center gap-2 px-3 rounded-lg text-sm font-medium transition-all border ${
          hasFilter
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
        }`}
      >
        <Tag className="h-3.5 w-3.5 shrink-0" />
        <span className="max-w-[120px] truncate">{label}</span>
        {hasFilter ? (
          <X
            className="h-3.5 w-3.5 shrink-0 opacity-70 hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
          />
        ) : (
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-64 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>
          ) : (
            <div className="max-h-72 overflow-y-auto scrollbar-thin py-1">
              {/* All option */}
              <button
                onClick={() => handleSelect("")}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  !value ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-foreground"
                }`}
              >
                <span><FolderOpen className="w-4 h-4 text-muted-foreground" /></span> Todas as categorias
              </button>

              {expenseCategories.length > 0 && (
                <>
                  <div className="px-3 pt-3 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Despesas</span>
                  </div>
                  {expenseCategories.map((cat) => (
                    <CategoryGroup
                      key={cat.id}
                      cat={cat}
                      selected={value}
                      onSelect={handleSelect}
                    />
                  ))}
                </>
              )}

              {incomeCategories.length > 0 && (
                <>
                  <div className="px-3 pt-3 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Receitas</span>
                  </div>
                  {incomeCategories.map((cat) => (
                    <CategoryGroup
                      key={cat.id}
                      cat={cat}
                      selected={value}
                      onSelect={handleSelect}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryGroup({
  cat,
  selected,
  onSelect,
}: {
  cat: Category & { type?: string; emoji?: string };
  selected: string;
  onSelect: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasSubs = cat.subcategories && cat.subcategories.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          if (hasSubs) {
            setExpanded((e) => !e);
            onSelect(cat.name);
          } else {
            onSelect(cat.name);
          }
        }}
        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors group ${
          selected === cat.name ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-foreground"
        }`}
      >
        <span className="flex-shrink-0 text-muted-foreground"><Folder className="w-4 h-4" /></span>
        <span className="flex-1">{cat.name}</span>
        {hasSubs && (
          <ChevronDown
            className={`h-3 w-3 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
            onClick={(e) => { e.stopPropagation(); setExpanded((e) => !e); }}
          />
        )}
      </button>

      {expanded && hasSubs && (
        <div className="border-l border-border ml-5 mr-2">
          {cat.subcategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => onSelect(sub.name)}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                selected === sub.name ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-sm leading-none text-muted-foreground">•</span>
              {sub.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
