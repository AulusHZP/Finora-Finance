import { describe, it, expect } from "vitest";
import { formatCurrencyBRL, parseCurrencyInputBRL } from "@/lib/currency";

describe("parseCurrencyInputBRL", () => {
  it("parses pt-BR format with thousands separator", () => {
    expect(parseCurrencyInputBRL("1.234,56")).toBe(1234.56);
  });

  it("parses en-US format with thousands separator", () => {
    expect(parseCurrencyInputBRL("1,234.56")).toBe(1234.56);
  });

  it("parses comma as decimal separator", () => {
    expect(parseCurrencyInputBRL("10,50")).toBe(10.5);
  });

  it("strips currency symbol and spaces", () => {
    expect(parseCurrencyInputBRL("R$ 25")).toBe(25);
    expect(parseCurrencyInputBRL("r$ 1.234,00")).toBe(1234);
  });

  it("treats a single dot with 3 decimals as thousands separator", () => {
    expect(parseCurrencyInputBRL("1.234")).toBe(1234);
  });

  it("keeps a single dot with 2 decimals as decimal separator", () => {
    expect(parseCurrencyInputBRL("12.34")).toBe(12.34);
  });

  it("preserves a leading minus sign", () => {
    expect(parseCurrencyInputBRL("-50,00")).toBe(-50);
  });

  it("returns null for empty or non-numeric input", () => {
    expect(parseCurrencyInputBRL("")).toBeNull();
    expect(parseCurrencyInputBRL("abc")).toBeNull();
    expect(parseCurrencyInputBRL("-")).toBeNull();
  });
});

describe("formatCurrencyBRL", () => {
  it("formats using the BRL currency style", () => {
    //   = non-breaking space emitted by Intl
    expect(formatCurrencyBRL(1234.56).replace(/ /g, " ")).toBe("R$ 1.234,56");
  });
});
