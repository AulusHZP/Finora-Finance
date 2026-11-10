import { useState, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Upload, FileText, AlertTriangle, X } from "lucide-react";
import { parseCurrencyInputBRL, formatCurrencyBRL } from "@/lib/currency";

type MappableField = "date" | "description" | "amount" | "skip";

/**
 * Sign convention of the "amount" column:
 * - creditCard (fatura de cartão): positive = expense, negative = payment/refund
 * - bankStatement (extrato de conta): positive = money in, negative = money out
 */
type SignConvention = "creditCard" | "bankStatement";

interface PreviewTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  isDuplicate: boolean;
}

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"|"$/g, "").trim());
};

const parseDateToIso = (raw: string): string | null => {
  const value = raw.trim();
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const iso = new Date(value);
    return Number.isNaN(iso.getTime()) ? null : iso.toISOString();
  }

  const ptBrMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (ptBrMatch) {
    const day = ptBrMatch[1].padStart(2, "0");
    const month = ptBrMatch[2].padStart(2, "0");
    const year = ptBrMatch[3].length === 2 ? `20${ptBrMatch[3]}` : ptBrMatch[3];
    const iso = new Date(`${year}-${month}-${day}T00:00:00`);
    return Number.isNaN(iso.getTime()) ? null : iso.toISOString();
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString();
};

const ImportCSV = () => {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, MappableField>>({});
  const [signConvention, setSignConvention] = useState<SignConvention>("creditCard");
  const [duplicates, setDuplicates] = useState<number[]>([]);
  const [previewRows, setPreviewRows] = useState<PreviewTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "map" | "review">("upload");

  const parseCSV = useCallback((text: string) => {
    const lines = text
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => parseCsvLine(line));

    if (lines.length < 2) return;

    setHeaders(lines[0]);
    setRows(lines.slice(1));
    setError(null);
    setDuplicates([]);
    setPreviewRows([]);

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
    setError(null);

    const seen = new Set<string>();
    const dupes: number[] = [];
    const preview: PreviewTransaction[] = [];

    const dateCol = getMappedField("date");
    const amtCol = getMappedField("amount");
    const descCol = getMappedField("description");

    if (dateCol === -1 || amtCol === -1 || descCol === -1) {
      setError("Mapeie Data, Descrição e Valor antes de continuar.");
      return;
    }

    rows.forEach((row, i) => {
      const rawDate = row[dateCol] || "";
      const rawAmount = row[amtCol] || "";
      const rawDescription = row[descCol] || "";

      const parsedDate = parseDateToIso(rawDate);
      const parsedAmount = parseCurrencyInputBRL(rawAmount);
      const description = rawDescription.trim();

      if (!parsedDate || parsedAmount === null || parsedAmount === 0 || !description) {
        return;
      }

      const type: "income" | "expense" =
        signConvention === "creditCard"
          ? parsedAmount < 0 ? "income" : "expense"
          : parsedAmount < 0 ? "expense" : "income";
      const key = `${parsedDate}-${parsedAmount}-${description.toLowerCase()}`;
      const isDuplicate = seen.has(key);
      if (isDuplicate) {
        dupes.push(i);
      } else {
        seen.add(key);
      }

      preview.push({
        date: rawDate,
        description,
        amount: parsedAmount,
        type,
        isDuplicate
      });

    });

    if (preview.length === 0) {
      setError("Nenhuma transação válida encontrada no CSV para visualizar.");
      return;
    }

    setPreviewRows(preview);
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

  const resetImportState = () => {
    setStep("upload");
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setDuplicates([]);
    setPreviewRows([]);
    setError(null);
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Importar CSV</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visualize extratos bancários ou exportações de transações</p>
        <p role="status" className="text-sm text-muted-foreground mt-3">A importação e a limpeza de transações via CSV estão indisponíveis. É possível apenas visualizar os dados do arquivo; nenhuma transação será criada ou apagada.</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {["Envio", "Mapear Colunas", "Revisar"].map((label, i) => {
          const stepNames = ["upload", "map", "review"];
          const isActive = stepNames.indexOf(step) >= i;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </div>
              <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"} hidden sm:inline`}>{label}</span>
              {i < 2 && <div className={`w-6 lg:w-12 h-px ${isActive ? "bg-primary" : "bg-border"}`} />}
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
            <span>Selecione um arquivo .csv para pré-visualização</span>
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
            <button onClick={resetImportState} className="text-xs text-muted-foreground hover:text-foreground transition-default">
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

          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Tipo de arquivo (convenção de sinal do valor)</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSignConvention("creditCard")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-default ${signConvention === "creditCard" ? "bg-primary text-primary-foreground" : "bg-tag text-tag-foreground hover:bg-hover"}`}
              >
                Fatura de cartão (positivo = despesa)
              </button>
              <button
                type="button"
                onClick={() => setSignConvention("bankStatement")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-default ${signConvention === "bankStatement" ? "bg-primary text-primary-foreground" : "bg-tag text-tag-foreground hover:bg-hover"}`}
              >
                Extrato de conta (positivo = receita)
              </button>
            </div>
          </div>

          {!hasRequiredFields && (
            <div className="flex items-center gap-2 text-xs text-destructive mb-4">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Por favor, mapeie as colunas de data, descrição e valor</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive mb-4">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{error}</span>
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
          <h3 className="text-sm font-semibold text-foreground mb-1">Revisar dados do arquivo</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {previewRows.length - duplicates.length} {previewRows.length - duplicates.length === 1 ? "transação válida" : "transações válidas"} no arquivo
            {duplicates.length > 0 && <span className="text-destructive"> ({duplicates.length} {duplicates.length === 1 ? "duplicada" : "duplicadas"} no arquivo)</span>}
          </p>

          {error && (
            <div className="flex items-center gap-2 text-xs text-destructive mb-4">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{error}</span>
            </div>
          )}

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
                {previewRows.map((row, i) => {
                  return (
                    <tr key={i} className={`border-b border-border/50 ${row.isDuplicate ? "opacity-40 line-through" : ""}`}>
                      <td className="py-2 pr-4 text-xs text-foreground">{row.date || "—"}</td>
                      <td className="py-2 pr-4 text-xs text-foreground">{row.description || "—"}</td>
                      <td className={`py-2 text-right text-xs font-medium ${row.type === "income" ? "text-success" : "text-foreground"}`}>
                        {row.type === "income" ? "+" : "-"}
                        {formatCurrencyBRL(Math.abs(row.amount))}
                      </td>
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
            <button onClick={resetImportState} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-default">Escolher outro arquivo</button>
          </div>
        </div>
      )}

    </AppLayout>
  );
};

export default ImportCSV;
