import { describe, it, expect, beforeEach } from "vitest";
import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { nextStepInterval, getDifficultyTitle, moveSnake, setDirection } from "./game-logic.js";

describe("nextStepInterval", () => {
  it("returns correct base interval for easy difficulty", () => {
    state.difficulty = "easy";
    state.level = 1;
    state.rush = 0;
    expect(nextStepInterval()).toBe(180);
  });

  it("returns correct base interval for normal difficulty", () => {
    state.difficulty = "normal";
    state.level = 1;
    state.rush = 0;
    expect(nextStepInterval()).toBe(150);
  });

  it("returns correct base interval for hard difficulty", () => {
    state.difficulty = "hard";
    state.level = 1;
    state.rush = 0;
    expect(nextStepInterval()).toBe(120);
  });

  it("reduces interval as level increases", () => {
    state.difficulty = "normal";
    state.level = 5;
    state.rush = 0;
    // base 150 - min(72, 4*9) = 150 - 36 = 114
    expect(nextStepInterval()).toBe(114);
  });

  it("applies rush speed boost when rush is full", () => {
    state.difficulty = "normal";
    state.level = 1;
    state.rush = 100;
    // 150 - 32 = 118
    expect(nextStepInterval()).toBe(118);
  });

  it("caps at MIN_INTERVAL when speed reduction is high", () => {
    state.difficulty = "hard";
    state.level = 20;
    state.rush = 100;
    // base 120 - min(72, 19*12=228→72) - 32 = 16, but capped at 54
    expect(nextStepInterval()).toBe(CONFIG.MIN_INTERVAL);
  });
});

describe("getDifficultyTitle", () => {
  it("returns easy mode title", () => {
    state.difficulty = "easy";
    expect(getDifficultyTitle()).toBe("SerpentRush · 休闲模式");
  });

  it("returns normal mode title", () => {
    state.difficulty = "normal";
    expect(getDifficultyTitle()).toBe("SerpentRush · 标准模式");
  });

  it("returns hard mode title", () => {
    state.difficulty = "hard";
    expect(getDifficultyTitle()).toBe("SerpentRush · 硬核模式");
  });
});

describe("moveSnake", () => {
  beforeEach(() => {
    state.reset();
    state.difficulty = "normal";
  });

  it("moves snake forward on normal step", () => {
    const initialLength = state.snake.length;
    const oldHead = { ...state.snake[0] };

    const result = moveSnake();

    expect(result).toBeNull();
    expect(state.snake.length).toBe(initialLength);
    expect(state.snake[0].x).toBe(oldHead.x + 1);
    expect(state.snake[0].y).toBe(oldHead.y);
  });

  it("detects wall collision and returns gameOver", () => {
    // Move snake head to rightmost column, set direction right
    state.snake = [
      { x: 39, y: 12 },
      { x: 38, y: 12 },
      { x: 37, y: 12 }
    ];
    state.direction = { x: 1, y: 0 };
    state.nextDirection = { x: 1, y: 0 };

    const result = moveSnake();
    expect(result).toEqual({ gameOver: true });
  });

  it("detects self collision and returns gameOver", () => {
    // Create a tight loop: head goes right into body at (6,5)
    state.snake = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 5 }
    ];
    state.direction = { x: 1, y: 0 };
    state.nextDirection = { x: 1, y: 0 };

    const result = moveSnake();
    expect(result).toEqual({ gameOver: true });
  });

  it("detects obstacle collision and returns gameOver", () => {
    state.snake = [
      { x: 15, y: 12 },
      { x: 14, y: 12 },
      { x: 13, y: 12 }
    ];
    state.direction = { x: 1, y: 0 };
    state.nextDirection = { x: 1, y: 0 };
    state.obstacles = [{ x: 16, y: 12 }];

    const result = moveSnake();
    expect(result).toEqual({ gameOver: true });
  });

  it("grows snake when eating fruit", () => {
    // Place food right in front of snake head
    state.snake = [
      { x: 14, y: 12 },
      { x: 13, y: 12 },
      { x: 12, y: 12 }
    ];
    state.direction = { x: 1, y: 0 };
    state.nextDirection = { x: 1, y: 0 };
    state.food = { x: 15, y: 12, type: "fruit" };
    state.fruitCount = 0;

    const initialLength = state.snake.length;

    const result = moveSnake();

    expect(result).toBeNull();
    expect(state.snake.length).toBe(initialLength + 1);
    expect(state.fruitCount).toBe(1);
    expect(state.score).toBeGreaterThan(0);
  });

  it("fills rush when eating spark", () => {
    state.snake = [
      { x: 14, y: 12 },
      { x: 13, y: 12 },
      { x: 12, y: 12 }
    ];
    state.direction = { x: 1, y: 0 };
    state.nextDirection = { x: 1, y: 0 };
    state.specialFood = { x: 15, y: 12, type: "spark" };

    const result = moveSnake();

    expect(result).toBeNull();
    expect(state.rush).toBe(100);
    expect(state.everRushed).toBe(true);
    expect(state.sparkCount).toBe(1);
  });

  it("activates multiplier when eating prism", () => {
    state.snake = [
      { x: 14, y: 12 },
      { x: 13, y: 12 },
      { x: 12, y: 12 }
    ];
    state.direction = { x: 1, y: 0 };
    state.nextDirection = { x: 1, y: 0 };
    state.specialFood = { x: 15, y: 12, type: "prism" };

    const result = moveSnake();

    expect(result).toBeNull();
    expect(state.multiplierTicks).toBe(CONFIG.PRISM_MULTIPLIER_TICKS - 1);
    expect(state.prismCount).toBe(1);
  });
});

describe("setDirection", () => {
  beforeEach(() => {
    state.reset();
  });

  it("ignores reverse direction", () => {
    state.direction = { x: 1, y: 0 };
    state.nextDirection = { x: 1, y: 0 };

    setDirection("left");

    expect(state.nextDirection).toEqual({ x: 1, y: 0 });
  });

  it("sets valid perpendicular direction", () => {
    state.direction = { x: 1, y: 0 };
    state.nextDirection = { x: 1, y: 0 };

    setDirection("up");

    expect(state.nextDirection).toEqual({ x: 0, y: -1 });
  });

  it("ignores input when game is over", () => {
    state.state = "gameover";
    setDirection("up");
    // State should remain unchanged from initial direction
    expect(state.nextDirection).toEqual({ x: 1, y: 0 });
  });
});
