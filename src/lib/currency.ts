export const formatCurrencyBRL = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
};

export const parseCurrencyInputBRL = (value: string): number | null => {
  let normalized = value
    .trim()
    .replace(/\s/g, "")
    .replace(/R\$/gi, "")
    .replace(/[^0-9,.-]/g, "");

  if (!normalized || normalized === "-") {
    return null;
  }

  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");

    if (lastComma > lastDot) {
      // Example: 1.234,56
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      // Example: 1,234.56
      normalized = normalized.replace(/,/g, "");
    }
  } else if (hasComma) {
    const parts = normalized.split(",");
    const decimal = parts.pop() ?? "";
    const integer = parts.join("").replace(/\./g, "");
    normalized = `${integer}.${decimal}`;
  } else if (hasDot) {
    const parts = normalized.split(".");
    if (parts.length > 2) {
      const decimal = parts.pop() ?? "";
      const integer = parts.join("");
      normalized = `${integer}.${decimal}`;
    } else {
      const [integer, decimal] = parts;
      // Treat single dot as thousands separator only for patterns like 1.234
      if (decimal.length === 3 && integer.length >= 1) {
        normalized = `${integer}${decimal}`;
      }
    }
  }

  // Keep only a leading minus sign.
  normalized = normalized.replace(/(?!^)-/g, "");

  if (!normalized || normalized === "-") {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};
