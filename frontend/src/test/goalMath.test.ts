import { describe, it, expect } from "vitest";
import { monthsUntil, suggestedMonthlyContribution } from "@/lib/goalMath";

const JUL_2026 = new Date(2026, 6, 6);

describe("monthsUntil", () => {
  it("counts whole months between dates", () => {
    expect(monthsUntil(new Date(2026, 11, 15), JUL_2026)).toBe(5);
  });

  it("returns at least 1 for same-month or past deadlines", () => {
    expect(monthsUntil(new Date(2026, 6, 20), JUL_2026)).toBe(1);
    expect(monthsUntil(new Date(2026, 5, 1), JUL_2026)).toBe(1);
  });

  it("crosses year boundaries", () => {
    expect(monthsUntil(new Date(2027, 6, 6), JUL_2026)).toBe(12);
  });
});

describe("suggestedMonthlyContribution", () => {
  it("divides the remainder by the months left", () => {
    // faltam 1000, 5 meses até dezembro → 200/mês
    expect(suggestedMonthlyContribution(0, 1000, new Date(2026, 11, 15), JUL_2026)).toBe(200);
  });

  it("accounts for what is already saved", () => {
    expect(suggestedMonthlyContribution(500, 1000, new Date(2026, 11, 15), JUL_2026)).toBe(100);
  });

  it("returns null when the goal is complete", () => {
    expect(suggestedMonthlyContribution(1000, 1000, new Date(2026, 11, 15), JUL_2026)).toBeNull();
  });

  it("returns null without a target date", () => {
    expect(suggestedMonthlyContribution(0, 1000, null, JUL_2026)).toBeNull();
  });

  it("returns the full remainder when the deadline already passed", () => {
    expect(suggestedMonthlyContribution(200, 1000, new Date(2026, 0, 1), JUL_2026)).toBe(800);
  });
});
