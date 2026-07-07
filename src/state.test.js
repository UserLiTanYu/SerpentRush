import { describe, it, expect } from "vitest";
import { isOccupied, getActiveCombo } from "./state.js";

describe("isOccupied", () => {
  it("returns false when point is not occupied", () => {
    const state = {
      snake: [{ x: 5, y: 5 }],
      obstacles: [],
      food: { x: 8, y: 8 },
      specialFood: null
    };
    expect(isOccupied(state, { x: 0, y: 0 })).toBe(false);
  });

  it("returns true when point is occupied by snake", () => {
    const state = {
      snake: [
        { x: 5, y: 5 },
        { x: 4, y: 5 }
      ],
      obstacles: [],
      food: { x: 8, y: 8 },
      specialFood: null
    };
    expect(isOccupied(state, { x: 5, y: 5 })).toBe(true);
    expect(isOccupied(state, { x: 4, y: 5 })).toBe(true);
  });

  it("returns true when point is occupied by obstacle", () => {
    const state = {
      snake: [{ x: 5, y: 5 }],
      obstacles: [{ x: 10, y: 10 }],
      food: { x: 8, y: 8 },
      specialFood: null
    };
    expect(isOccupied(state, { x: 10, y: 10 })).toBe(true);
  });

  it("returns true when point is occupied by food", () => {
    const state = {
      snake: [{ x: 5, y: 5 }],
      obstacles: [],
      food: { x: 8, y: 8 },
      specialFood: null
    };
    expect(isOccupied(state, { x: 8, y: 8 })).toBe(true);
  });

  it("returns true when point is occupied by specialFood", () => {
    const state = {
      snake: [{ x: 5, y: 5 }],
      obstacles: [],
      food: { x: 8, y: 8 },
      specialFood: { x: 12, y: 6 }
    };
    expect(isOccupied(state, { x: 12, y: 6 })).toBe(true);
  });
});

describe("getActiveCombo", () => {
  it("returns base combo when no multiplier is active", () => {
    expect(getActiveCombo({ combo: 1, multiplierTicks: 0 })).toBe(1);
    expect(getActiveCombo({ combo: 2.5, multiplierTicks: 0 })).toBe(2.5);
  });

  it("returns doubled combo when multiplier is active", () => {
    expect(getActiveCombo({ combo: 2, multiplierTicks: 5 })).toBe(4);
    expect(getActiveCombo({ combo: 3.5, multiplierTicks: 1 })).toBe(7);
  });

  it("returns base combo when multiplierTicks is zero", () => {
    expect(getActiveCombo({ combo: 5, multiplierTicks: 0 })).toBe(5);
  });
});
