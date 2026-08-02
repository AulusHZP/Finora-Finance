import { describe, it, expect } from "vitest";
import { getCategoryStatus } from "./alert.service";
import { Decimal } from "@prisma/client/runtime/library";

describe("Alert Service - getCategoryStatus", () => {
  it("should return null if limit is null", () => {
    expect(getCategoryStatus(100, null)).toBeNull();
    expect(getCategoryStatus(100, undefined as any)).toBeNull();
  });

  it("should return null if limit is <= 0", () => {
    expect(getCategoryStatus(100, 0)).toBeNull();
    expect(getCategoryStatus(100, -50)).toBeNull();
  });

  it("should return 'safe' if spent is below alertThreshold", () => {
    // 50 spent out of 100 limit, threshold is 80 by default. 50% < 80%
    expect(getCategoryStatus(50, 100)).toBe("safe");
  });

  it("should return 'warning' if spent is >= alertThreshold but < 100", () => {
    // 80 spent out of 100 limit. 80% = 80%
    expect(getCategoryStatus(80, 100)).toBe("warning");
    expect(getCategoryStatus(99, 100)).toBe("warning");
  });

  it("should return 'danger' if spent is >= limit", () => {
    // 100 spent out of 100 limit. 100% = 100%
    expect(getCategoryStatus(100, 100)).toBe("danger");
    expect(getCategoryStatus(150, 100)).toBe("danger");
  });

  it("should support custom alertThreshold", () => {
    // 70 spent out of 100 limit, threshold is 70. 70% = 70%
    expect(getCategoryStatus(70, 100, 70)).toBe("warning");
    
    // 69 spent out of 100 limit, threshold is 70. 69% < 70%
    expect(getCategoryStatus(69, 100, 70)).toBe("safe");
  });
  
  it("should work correctly with Decimal types from Prisma", () => {
    const spent = new Decimal("85.5");
    const limit = new Decimal("100.0");
    
    expect(getCategoryStatus(spent, limit)).toBe("warning");
  });
});
