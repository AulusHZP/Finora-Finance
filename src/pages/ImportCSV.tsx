import { useState, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Upload, FileText, AlertTriangle, CheckCircle2, X } from "lucide-react";

interface ParsedRow {
  date: string;
  description: string;
  amount: string;
  [key: string]: string;
}

type MappableField = "date" | "description" | "amount" | "skip";

const ImportCSV = () => {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, MappableField>>({});
  const [duplicates, setDuplicates] = useState<number[]>([]);
  const [step, setStep] = useState<"upload" | "map" | "review" | "done">("upload");

  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split("\n").map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
    if (lines.length < 2) return;
    setHeaders(lines[0]);
    setRows(lines.slice(1));

    // Auto-detect mapping
    const autoMap: Record<number, MappableField> = {};
    lines[0].forEach((h, i) => {
      const lower = h.toLowerCase();
      if (lower.includes("date")) autoMap[i] = "date";
      else if (lower.includes("desc") || lower.includes("name") || lower.includes("memo") || lower.includes("title")) autoMap[i] = "description";
      else if (lower.includes("amount") || lower.includes("value")) autoMap[i] = "amount";
      else autoMap[i] = "skip";
    });
    setMapping(autoMap);
    setStep("map");
  }, []);

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => parseCSV(e.target?.result as string);
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) handleFile(f);
  };

  const detectDuplicates = () => {
    const seen = new Set<string>();
    const dupes: number[] = [];
    rows.forEach((row, i) => {
      const dateCol = Object.entries(mapping).find(([, v]) => v === "date")?.[0];
      const amtCol = Object.entries(mapping).find(([, v]) => v === "amount")?.[0];
      const descCol = Object.entries(mapping).find(([, v]) => v === "description")?.[0];
      const key = `${dateCol != null ? row[+dateCol] : ""}-${amtCol != null ? row[+amtCol] : ""}-${descCol != null ? row[+descCol] : ""}`;
      if (seen.has(key)) dupes.push(i);
      else seen.add(key);
    });
    setDuplicates(dupes);
    setStep("review");
  };

  const getMappedField = (field: MappableField) => {
    const colIdx = Object.entries(mapping).find(([, v]) => v === field)?.[0];
    return colIdx != null ? +colIdx : -1;
  };

  const hasRequiredFields = ["date", "description", "amount"].every((f) =>
    Object.values(mapping).includes(f as MappableField)
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Importar CSV</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Envie extratos bancários ou exportações de transações</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {["Envio", "Mapear Colunas", "Revisar", "Concluído"].map((label, i) => {
          const stepNames = ["upload", "map", "review", "done"];
          const isActive = stepNames.indexOf(step) >= i;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </div>
              <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"} hidden sm:inline`}>{label}</span>
              {i < 3 && <div className={`w-6 lg:w-12 h-px ${isActive ? "bg-primary" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>

      {step === "upload" && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="glass-card p-10 lg:p-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-border hover:border-primary/30 transition-default cursor-pointer"
          onClick={() => document.getElementById("csv-input")?.click()}
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-sm font-semibold text-foreground mb-1">Solte seu arquivo CSV aqui</h3>
          <p className="text-xs text-muted-foreground mb-4">ou clique para navegar</p>
          <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span>Suporta arquivos .csv de qualquer banco</span>
          </div>
        </div>
      )}

      {step === "map" && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Mapear Colunas</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{file?.name} — {rows.length} linhas detectadas</p>
            </div>
            <button onClick={() => { setStep("upload"); setFile(null); setRows([]); }} className="text-xs text-muted-foreground hover:text-foreground transition-default">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {headers.map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-foreground w-40 truncate font-medium">{h}</span>
                <span className="text-xs text-muted-foreground truncate w-32">ex: {rows[0]?.[i]}</span>
                <select
                  value={mapping[i] || "skip"}
                  onChange={(e) => setMapping({ ...mapping, [i]: e.target.value as MappableField })}
                  className="h-8 px-2 bg-muted rounded-lg text-sm text-foreground border-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="skip">Ignorar</option>
                  <option value="date">Data</option>
                  <option value="description">Descrição</option>
                  <option value="amount">Valor</option>
                </select>
              </div>
            ))}
          </div>

          {!hasRequiredFields && (
            <div className="flex items-center gap-2 text-xs text-destructive mb-4">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Por favor, mapeie as colunas de data, descrição e valor</span>
            </div>
          )}

          <button
            onClick={detectDuplicates}
            disabled={!hasRequiredFields}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-default disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar para Revisão
          </button>
        </div>
      )}

      {step === "review" && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Revisar Importação</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {rows.length - duplicates.length} transações para importar
            {duplicates.length > 0 && <span className="text-destructive"> ({duplicates.length} duplicadas excluídas)</span>}
          </p>

          <div className="overflow-x-auto mb-4 max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Data</th>
                  <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Descrição</th>
                  <th className="text-right text-xs font-medium text-muted-foreground pb-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isDupe = duplicates.includes(i);
                  return (
                    <tr key={i} className={`border-b border-border/50 ${isDupe ? "opacity-40 line-through" : ""}`}>
                      <td className="py-2 pr-4 text-xs text-foreground">{row[getMappedField("date")] || "—"}</td>
                      <td className="py-2 pr-4 text-xs text-foreground">{row[getMappedField("description")] || "—"}</td>
                      <td className="py-2 text-right text-xs font-medium text-foreground">{row[getMappedField("amount")] || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep("map")} className="px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-hover transition-default">
              Voltar
            </button>
            <button onClick={() => setStep("done")} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-default">
              Importar {rows.length - duplicates.length} Transações
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="glass-card p-10 flex flex-col items-center text-center">
          <CheckCircle2 className="h-12 w-12 text-success mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">Importação Concluída</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {rows.length - duplicates.length} transações importadas com sucesso.
          </p>
          <button onClick={() => { setStep("upload"); setFile(null); setRows([]); setDuplicates([]); }} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-default">
            Importar Mais
          </button>
        </div>
      )}
    </AppLayout>
  );
};

export default ImportCSV;
