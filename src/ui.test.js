import { describe, it, expect } from "vitest";
import { formatCombo, formatDuration } from "./ui.js";

describe("formatCombo", () => {
  it("formats integer combo without decimal", () => {
    expect(formatCombo(1)).toBe("1");
    expect(formatCombo(5)).toBe("5");
    expect(formatCombo(8)).toBe("8");
  });

  it("formats fractional combo with one decimal", () => {
    expect(formatCombo(1.5)).toBe("1.5");
    expect(formatCombo(3.3)).toBe("3.3");
  });

  it("strips trailing zero from x.0 values", () => {
    expect(formatCombo(2.0)).toBe("2");
  });

  it("keeps non-zero decimal", () => {
    expect(formatCombo(2.1)).toBe("2.1");
    expect(formatCombo(7.8)).toBe("7.8");
  });
});

describe("formatDuration", () => {
  it("formats zero milliseconds", () => {
    expect(formatDuration(0)).toBe("0 秒");
  });

  it("formats seconds only when under one minute", () => {
    expect(formatDuration(5000)).toBe("5 秒");
    expect(formatDuration(59000)).toBe("59 秒");
  });

  it("formats minutes and seconds with zero-padding", () => {
    expect(formatDuration(65000)).toBe("1:05");
    expect(formatDuration(125000)).toBe("2:05");
    expect(formatDuration(3600000)).toBe("60:00");
  });

  it("handles negative values gracefully", () => {
    expect(formatDuration(-1000)).toBe("0 秒");
  });
});
