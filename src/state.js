import { CONFIG, DIRECTIONS } from "./config.js";

function isOccupied(state, point) {
  return state.snake.some((part) => part.x === point.x && part.y === point.y)
    || state.obstacles.some((block) => block.x === point.x && block.y === point.y)
    || (state.food && state.food.x === point.x && state.food.y === point.y)
    || (state.specialFood && state.specialFood.x === point.x && state.specialFood.y === point.y);
}

function spawnItem(state, type) {
  let point;
  do {
    point = {
      x: Math.floor(Math.random() * CONFIG.BOARD_COLUMNS),
      y: Math.floor(Math.random() * CONFIG.BOARD_ROWS),
      type
    };
  } while (isOccupied(state, point));
  return point;
}

function getActiveCombo(state) {
  return state.combo * (state.multiplierTicks > 0 ? 2 : 1);
}

function readBestScore(difficulty) {
  return Number(localStorage.getItem("serpentRushBest_" + difficulty) || "0");
}

function saveBestScore(value, difficulty) {
  localStorage.setItem("serpentRushBest_" + difficulty, String(value));
}

function loadBgPreferences(state) {
  state.shellBgIndex = Number(localStorage.getItem("serpentRushShellBg") || "5");
  state.boardBgIndex = Number(localStorage.getItem("serpentRushBoardBg") || "4");
  if (!Number.isInteger(state.shellBgIndex) || state.shellBgIndex < 0 || state.shellBgIndex > 5) {
    state.shellBgIndex = 5;
  }
  if (!Number.isInteger(state.boardBgIndex) || state.boardBgIndex < 0 || state.boardBgIndex > 4) {
    state.boardBgIndex = 4;
  }
}

function saveShellBg(index) {
  localStorage.setItem("serpentRushShellBg", String(index));
}

function saveBoardBg(index) {
  localStorage.setItem("serpentRushBoardBg", String(index));
}

function loadAchievements() {
  try {
    return JSON.parse(localStorage.getItem("serpentRushAchievements") || "{}");
  } catch (e) {
    return {};
  }
}

function saveAchievements(achievements) {
  localStorage.setItem("serpentRushAchievements", JSON.stringify(achievements));
}

class GameState {
  constructor() {
    this.snake = [];
    this.direction = DIRECTIONS.right;
    this.nextDirection = DIRECTIONS.right;
    this.food = null;
    this.specialFood = null;
    this.obstacles = [];
    this.score = 0;
    this.best = 0;
    this.combo = 1;
    this.level = 1;
    this.rush = 0;
    this.multiplierTicks = 0;
    this.moveTimer = 0;
    this.lastTime = 0;
    this.roundElapsed = 0;
    this.state = "ready";
    this.particles = [];
    this.floatingTexts = [];
    this.shellBgIndex = 5;
    this.boardBgIndex = 4;
    this.audioContext = null;
    this.musicEnabled = true;
    this.musicGain = null;
    this.musicTimer = null;
    this.musicNextTime = 0;
    this.musicStep = 0;
    this.helpPreviousState = null;
    this.maxCombo = 1;
    this.maxLevel = 1;
    this.fruitCount = 0;
    this.sparkCount = 0;
    this.prismCount = 0;
    this.difficulty = "normal";
    this.achievements = loadAchievements();
    this.achievementsNew = [];
    this.everRushed = false;
    this.earlySurvived = false;
  }

  reset() {
    this.snake = [
      { x: 14, y: 12 },
      { x: 13, y: 12 },
      { x: 12, y: 12 }
    ];
    this.direction = DIRECTIONS.right;
    this.nextDirection = DIRECTIONS.right;
    this.obstacles = [];
    this.score = 0;
    this.combo = 1;
    this.level = 1;
    this.rush = 0;
    this.multiplierTicks = 0;
    this.moveTimer = 0;
    this.roundElapsed = 0;
    this.maxCombo = 1;
    this.maxLevel = 1;
    this.fruitCount = 0;
    this.sparkCount = 0;
    this.prismCount = 0;
    this.achievementsNew = [];
    this.everRushed = false;
    this.earlySurvived = false;
    this.lastTime = performance.now();
    this.state = "ready";
    this.particles = [];
    this.floatingTexts = [];
    this.best = readBestScore(this.difficulty);
    this.food = spawnItem(this, "fruit");
    this.specialFood = null;
  }
}

const state = new GameState();

export {
  isOccupied,
  spawnItem,
  getActiveCombo,
  readBestScore,
  saveBestScore,
  loadBgPreferences,
  saveShellBg,
  saveBoardBg,
  loadAchievements,
  saveAchievements,
  GameState,
  state,
};
