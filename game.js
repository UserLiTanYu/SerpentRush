(() => {
  "use strict";

const CONFIG = {
  BOARD_COLUMNS: 40,
  BOARD_ROWS: 24,
  COMBO_DECAY: 0.015,
  COMBO_FRUIT_GAIN: 0.35,
  COMBO_SPARK_GAIN: 0.75,
  COMBO_MAX: 8,
  SCORE_FRUIT: 10,
  SCORE_SPARK: 20,
  SCORE_PRISM: 30,
  SCORE_SHIELD: 15,
  SCORE_SLOW: 10,
  SCORE_PER_LEVEL: 80,
  RUSH_FRUIT_GAIN: 12,
  RUSH_SPECIAL_GAIN: 24,
  RUSH_DECAY: 0.5,
  RUSH_SPEED_BOOST: 32,
  PRISM_DURATION_MS: 10000,
  SHIELD_DURATION_MS: 8000,
  SLOW_DURATION_MS: 12000,
  SLOW_SPEED_FACTOR: 2,
  TRAIL_LENGTH: 6,
  HUE_SHIFT_DURATION: 400,
  OBSTACLE_START_LEVEL: 2,
  OBSTACLE_BASE: 4,
  OBSTACLE_PER_LEVEL: 2,
  OBSTACLE_MAX: 24,
  OBSTACLE_SAFE_DISTANCE: 6,
  SPECIAL_SPAWN_BASE: 0.035,
  SPECIAL_SPAWN_PER_LEVEL: 0.004,
  SPECIAL_SPARK_CHANCE: 0.40,
  SPECIAL_PRISM_CHANCE: 0.25,
  SPECIAL_SHIELD_CHANCE: 0.20,
  SPECIAL_SLOW_CHANCE: 0.15,
  BASE_INTERVAL: 150,
  SPEED_PER_LEVEL: 9,
  SPEED_REDUCTION_CAP: 72,
  MIN_INTERVAL: 54,
  DIFFICULTIES: {
    easy: {
      name: "简单",
      badge: "休闲",
      baseInterval: 180,
      speedPerLevel: 6,
      obstacleStartLevel: 3,
      obstacleOffset: -2,
      specialSpawnMultiplier: 1.5,
      comboDecay: 0.01,
    },
    normal: {
      name: "普通",
      badge: "标准",
      baseInterval: 150,
      speedPerLevel: 9,
      obstacleStartLevel: 2,
      obstacleOffset: 0,
      specialSpawnMultiplier: 1.0,
      comboDecay: 0.015,
    },
    hard: {
      name: "困难",
      badge: "硬核",
      baseInterval: 120,
      speedPerLevel: 12,
      obstacleStartLevel: 1,
      obstacleOffset: 2,
      specialSpawnMultiplier: 0.7,
      comboDecay: 0.02,
    },
  },
  PARTICLE_FRUIT_COUNT: 14,
  PARTICLE_SPECIAL_COUNT: 28,
  PARTICLE_GAMEOVER_COUNT: 28,
  TONE_FRUIT_HZ: 360,
  TONE_SPARK_HZ: 580,
  TONE_PRISM_HZ: 720,
  TONE_SHIELD_HZ: 440,
  TONE_SLOW_HZ: 260,
  MUSIC_BPM: 126,
  MUSIC_SCHEDULE_INTERVAL: 260,
};
const ACHIEVEMENTS = [
  { id: "first_score",  name: "初出茅庐", desc: "单局首次达到 50 分", icon: "⭐", color: "#5cf28b", category: "入门" },
  { id: "first_combo",  name: "连击入门", desc: "单局连击达到 x3", icon: "🔥", color: "#ffd166", category: "入门" },
  { id: "first_rush",   name: "冲刺初体验", desc: "首次触发冲刺状态", icon: "⚡", color: "#4dd7ff", category: "入门" },
  { id: "combo_master", name: "连击大师", desc: "单局连击达到 x6", icon: "💥", color: "#ffd166", category: "进阶" },
  { id: "prism_hunter", name: "棱晶猎人", desc: "单局吃到 5 个棱晶", icon: "💎", color: "#a98bff", category: "进阶" },
  { id: "survivor_3min",name: "幸存者",   desc: "单局存活超过 3 分钟", icon: "🛡️", color: "#5cf28b", category: "进阶" },
  { id: "fruit_feast",  name: "果实盛宴", desc: "单局吃到 50 个果实", icon: "🍎", color: "#ff6b6b", category: "进阶" },
  { id: "score_200",    name: "两百分",   desc: "单局达到 200 分", icon: "🎯", color: "#ffd166", category: "高分" },
  { id: "score_500",    name: "五百分",   desc: "单局达到 500 分", icon: "🏆", color: "#ff6b6b", category: "高分" },
  { id: "level_10",     name: "登峰造极", desc: "单局达到等级 10", icon: "⛰️", color: "#a98bff", category: "高分" },
  { id: "spark_addict", name: "电光成瘾", desc: "单局吃到 8 个电光", icon: "⚡", color: "#4dd7ff", category: "特殊" },
  { id: "perfectionist",name: "完美开场", desc: "前 30 秒未死亡且分数达到 80 分", icon: "✨", color: "#5cf28b", category: "特殊" },
];
const COLORS = {
  boardA: "#11151a",
  boardB: "#151a20",
  grid: "rgba(255,255,255,0.045)",
  snake: "#5cf28b",
  snakeDark: "#159768",
  head: "#f6f1e8",
  fruit: "#ff6b6b",
  spark: "#4dd7ff",
  prism: "#a98bff",
  shield: "#ffd166",
  slow: "#ff8ec4",
  wall: "#68707b",
  text: "#f6f1e8",
  muted: "rgba(246,241,232,0.64)"
};
const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};
const SHELL_BACKGROUNDS = [
  { name: "极光深空", cls: "shell-aurora" },
  { name: "街机网格", cls: "shell-arcade" },
  { name: "午夜光轨", cls: "shell-midnight" },
  { name: "碳纤维面板", cls: "shell-carbon" },
  { name: "电路暗板", cls: "shell-circuit" },
  { name: "暮色霓虹", cls: "shell-sunset" }
];
const BOARD_BACKGROUNDS = ["space", "track", "pixel", "circuit", "nebula"];
const BOARD_BG_NAMES = {
  space: "深空网格",
  track: "霓虹赛道",
  pixel: "像素地砖",
  circuit: "电路核心",
  nebula: "暗色星云"
};
const canvas = document.querySelector("#gameCanvas");
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const CELL_SIZE = Math.min(CANVAS_WIDTH / CONFIG.BOARD_COLUMNS, CANVAS_HEIGHT / CONFIG.BOARD_ROWS);

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
  return state.combo * (performance.now() < state.multiplierUntil ? 2 : 1);
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
    this.multiplierUntil = 0;
    this.shieldUntil = 0;
    this.slowUntil = 0;
    this.trailHistory = [];
    this.hueShiftUntil = 0;
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
    this.shieldCount = 0;
    this.slowCount = 0;
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
    this.multiplierUntil = 0;
    this.shieldUntil = 0;
    this.slowUntil = 0;
    this.trailHistory = [];
    this.hueShiftUntil = 0;
    this.moveTimer = 0;
    this.roundElapsed = 0;
    this.maxCombo = 1;
    this.maxLevel = 1;
    this.fruitCount = 0;
    this.sparkCount = 0;
    this.prismCount = 0;
    this.shieldCount = 0;
    this.slowCount = 0;
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

function burst(point, color, amount) {
  for (let i = 0; i < amount; i += 1) {
    state.particles.push({
      x: (point.x + 0.5) * CELL_SIZE,
      y: (point.y + 0.5) * CELL_SIZE,
      vx: (Math.random() - 0.5) * 220,
      vy: (Math.random() - 0.5) * 220,
      life: 420 + Math.random() * 240,
      maxLife: 660,
      color
    });
  }
}
function floatText(point, text, color) {
  state.floatingTexts.push({
    x: (point.x + 0.5) * CELL_SIZE,
    y: (point.y + 0.3) * CELL_SIZE,
    text,
    color,
    life: 720,
    maxLife: 720
  });
}
function updateEffects(delta) {
  state.particles = state.particles.filter((particle) => {
    particle.life -= delta;
    particle.x += particle.vx * delta / 1000;
    particle.y += particle.vy * delta / 1000;
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    return particle.life > 0;
  });
  state.floatingTexts = state.floatingTexts.filter((text) => {
    text.life -= delta;
    text.y -= delta * 0.035;
    return text.life > 0;
  });
}

function unlockAudio() {
  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.audioContext.state === "suspended") {
    state.audioContext.resume();
  }
}
function playTone(type) {
  if (!state.audioContext) {
    return;
  }
  const frequency =
    type === "fruit" ? CONFIG.TONE_FRUIT_HZ :
    type === "spark" ? CONFIG.TONE_SPARK_HZ :
    type === "prism" ? CONFIG.TONE_PRISM_HZ :
    type === "shield" ? CONFIG.TONE_SHIELD_HZ :
    CONFIG.TONE_SLOW_HZ;
  const osc = state.audioContext.createOscillator();
  const gain = state.audioContext.createGain();
  osc.frequency.value = frequency;
  osc.type = "triangle";
  gain.gain.setValueAtTime(0.07, state.audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, state.audioContext.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(state.audioContext.destination);
  osc.start();
  osc.stop(state.audioContext.currentTime + 0.13);
}
function playShieldHit() {
  if (!state.audioContext) {
    return;
  }
  const osc = state.audioContext.createOscillator();
  const gain = state.audioContext.createGain();
  osc.frequency.value = CONFIG.TONE_SHIELD_HZ;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.09, state.audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, state.audioContext.currentTime + 0.08);
  osc.connect(gain);
  gain.connect(state.audioContext.destination);
  osc.start();
  osc.stop(state.audioContext.currentTime + 0.09);
}
function playMusicNote(frequency, startTime, duration, type, volume) {
  if (!state.musicGain || frequency <= 0) {
    return;
  }
  const osc = state.audioContext.createOscillator();
  const gain = state.audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(state.musicGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.04);
}
function scheduleMusic() {
  if (!state.audioContext || !state.musicGain || !state.musicEnabled) {
    return;
  }
  const stepDuration = 60 / CONFIG.MUSIC_BPM / 2;
  const lookAhead = state.audioContext.currentTime + 1.2;
  const bassNotes = [130.81, 0, 98, 0, 110, 0, 87.31, 0, 130.81, 0, 146.83, 0, 98, 0, 116.54, 0];
  const leadNotes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 0, 659.25, 783.99, 880, 1046.5, 880, 783.99, 659.25, 0];
  const sparkleNotes = [0, 0, 0, 1046.5, 0, 0, 987.77, 0, 0, 1174.66, 0, 0, 1046.5, 0, 0, 0];
  while (state.musicNextTime < lookAhead) {
    const index = state.musicStep % 16;
    playMusicNote(bassNotes[index], state.musicNextTime, stepDuration * 1.6, "triangle", 0.034);
    playMusicNote(leadNotes[index], state.musicNextTime + stepDuration * 0.08, stepDuration * 0.72, "square", 0.018);
    if (sparkleNotes[index]) {
      playMusicNote(sparkleNotes[index], state.musicNextTime + stepDuration * 0.44, stepDuration * 0.38, "sine", 0.014);
    }
    if (state.musicStep % 8 === 0) {
      playMusicNote(bassNotes[index] / 2, state.musicNextTime, stepDuration * 3.4, "sine", 0.016);
    }
    state.musicNextTime += stepDuration;
    state.musicStep += 1;
  }
}
function startMusic() {
  if (!state.audioContext || !state.musicEnabled || state.musicGain || state.state !== "running") {
    return;
  }
  state.musicGain = state.audioContext.createGain();
  state.musicGain.gain.setValueAtTime(0.0001, state.audioContext.currentTime);
  state.musicGain.gain.exponentialRampToValueAtTime(0.80, state.audioContext.currentTime + 0.35);
  state.musicGain.connect(state.audioContext.destination);
  state.musicNextTime = state.audioContext.currentTime + 0.05;
  state.musicStep = 0;
  scheduleMusic();
  state.musicTimer = window.setInterval(scheduleMusic, CONFIG.MUSIC_SCHEDULE_INTERVAL);
}
function stopMusic() {
  if (state.musicTimer) {
    window.clearInterval(state.musicTimer);
    state.musicTimer = null;
  }
  if (state.musicGain && state.audioContext) {
    const gainToStop = state.musicGain;
    gainToStop.gain.cancelScheduledValues(state.audioContext.currentTime);
    gainToStop.gain.setValueAtTime(Math.max(gainToStop.gain.value, 0.0001), state.audioContext.currentTime);
    gainToStop.gain.exponentialRampToValueAtTime(0.0001, state.audioContext.currentTime + 0.2);
    window.setTimeout(function () { gainToStop.disconnect(); }, 260);
  }
  state.musicGain = null;
}

let ctx = canvas.getContext("2d");
let bgCache = null;
let bgCacheKey = null;
const supportsOffscreen = typeof OffscreenCanvas !== "undefined";
function drawGlow(x, y, radius, color) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
const boardBgDrawFns = {};
boardBgDrawFns.space = function () {
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  g.addColorStop(0, "#101824");
  g.addColorStop(1, "#05070b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawGlow(CANVAS_WIDTH * 0.18, CANVAS_HEIGHT * 0.18, CANVAS_WIDTH * 0.16, "rgba(92,242,139,0.14)");
  drawGlow(CANVAS_WIDTH * 0.86, CANVAS_HEIGHT * 0.76, CANVAS_WIDTH * 0.22, "rgba(77,215,255,0.12)");
};
boardBgDrawFns.track = function () {
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  g.addColorStop(0, "#111821");
  g.addColorStop(1, "#070a0f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.lineWidth = Math.max(4, CANVAS_WIDTH * 0.014);
  ctx.strokeStyle = "rgba(92,242,139,0.16)";
  ctx.beginPath();
  ctx.moveTo(-CANVAS_WIDTH * 0.1, CANVAS_HEIGHT * 0.78);
  ctx.lineTo(CANVAS_WIDTH * 0.42, -CANVAS_HEIGHT * 0.06);
  ctx.stroke();
  ctx.strokeStyle = "rgba(77,215,255,0.12)";
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH * 0.18, CANVAS_HEIGHT * 1.12);
  ctx.lineTo(CANVAS_WIDTH * 0.78, -CANVAS_HEIGHT * 0.08);
  ctx.stroke();
  ctx.lineWidth = Math.max(2, CANVAS_WIDTH * 0.004);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.setLineDash([22, 24]);
  ctx.beginPath();
  ctx.moveTo(0, CANVAS_HEIGHT * 0.62);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT * 0.18);
  ctx.stroke();
  ctx.setLineDash([]);
};
boardBgDrawFns.pixel = function () {
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  g.addColorStop(0, "#101824");
  g.addColorStop(1, "#070b0f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawGlow(CANVAS_WIDTH * 0.15, CANVAS_HEIGHT * 0.2, CANVAS_WIDTH * 0.15, "rgba(92,242,139,0.15)");
  drawGlow(CANVAS_WIDTH * 0.82, CANVAS_HEIGHT * 0.18, CANVAS_WIDTH * 0.17, "rgba(169,139,255,0.11)");
};
boardBgDrawFns.circuit = function () {
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  g.addColorStop(0, "#0d1718");
  g.addColorStop(1, "#070b0d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = "rgba(92,242,139,0.14)";
  ctx.lineWidth = Math.max(1, CANVAS_WIDTH * 0.0016);
  for (let i = 0; i < 10; i += 1) {
    const y = CANVAS_HEIGHT * 0.1 + i * (CANVAS_HEIGHT * 0.07);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH * 0.05, y);
    ctx.lineTo(CANVAS_WIDTH * 0.22 + i * CANVAS_WIDTH * 0.022, y);
    ctx.lineTo(CANVAS_WIDTH * 0.28 + i * CANVAS_WIDTH * 0.022, y + CANVAS_HEIGHT * 0.05);
    ctx.lineTo(CANVAS_WIDTH * 0.94, y + CANVAS_HEIGHT * 0.05);
    ctx.stroke();
  }
  for (let i = 0; i < 30; i += 1) {
    const x = CANVAS_WIDTH * 0.06 + ((i * 113) % (CANVAS_WIDTH * 0.88));
    const y = CANVAS_HEIGHT * 0.09 + ((i * 79) % (CANVAS_HEIGHT * 0.82));
    ctx.fillStyle = i % 3 === 0 ? "rgba(77,215,255,0.28)" : "rgba(92,242,139,0.22)";
    ctx.beginPath();
    ctx.arc(x, y, Math.max(2, CANVAS_WIDTH * 0.003), 0, Math.PI * 2);
    ctx.fill();
  }
};
boardBgDrawFns.nebula = function () {
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  g.addColorStop(0, "#111426");
  g.addColorStop(1, "#06070d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawGlow(CANVAS_WIDTH * 0.28, CANVAS_HEIGHT * 0.28, CANVAS_WIDTH * 0.26, "rgba(169,139,255,0.2)");
  drawGlow(CANVAS_WIDTH * 0.62, CANVAS_HEIGHT * 0.58, CANVAS_WIDTH * 0.3, "rgba(77,215,255,0.15)");
  drawGlow(CANVAS_WIDTH * 0.8, CANVAS_HEIGHT * 0.22, CANVAS_WIDTH * 0.18, "rgba(255,107,107,0.12)");
};
function drawBoardDirect(targetCtx) {
  boardBgDrawFns[BOARD_BACKGROUNDS[state.boardBgIndex]]();
  for (let y = 0; y < CONFIG.BOARD_ROWS; y += 1) {
    for (let x = 0; x < CONFIG.BOARD_COLUMNS; x += 1) {
      if ((x + y) % 2 === 0) {
        targetCtx.fillStyle = "rgba(255,255,255,0.025)";
        targetCtx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }
  targetCtx.strokeStyle = COLORS.grid;
  targetCtx.lineWidth = 1;
  for (let i = 0; i <= CONFIG.BOARD_COLUMNS; i += 1) {
    const p = i * CELL_SIZE;
    targetCtx.beginPath();
    targetCtx.moveTo(p, 0);
    targetCtx.lineTo(p, CANVAS_HEIGHT);
    targetCtx.stroke();
  }
  for (let i = 0; i <= CONFIG.BOARD_ROWS; i += 1) {
    const p = i * CELL_SIZE;
    targetCtx.beginPath();
    targetCtx.moveTo(0, p);
    targetCtx.lineTo(CANVAS_WIDTH, p);
    targetCtx.stroke();
  }
}
function ensureBgCache() {
  if (!supportsOffscreen) return;
  const currentKey = BOARD_BACKGROUNDS[state.boardBgIndex];
  if (bgCache && bgCacheKey === currentKey) return;
  const offscreen = new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const offCtx = offscreen.getContext("2d");
  const savedCtx = ctx;
  ctx = offCtx;
  drawBoardDirect(offCtx);
  ctx = savedCtx;
  bgCache = offscreen;
  bgCacheKey = currentKey;
}
function invalidateBgCache() {
  bgCache = null;
  bgCacheKey = null;
}
function drawBoard() {
  ensureBgCache();
  if (bgCache) {
    ctx.drawImage(bgCache, 0, 0);
  } else {
    drawBoardDirect(ctx);
  }
}
function roundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
function drawCell(point, fill, inset, radius) {
  if (inset === undefined) inset = 4;
  if (radius === undefined) radius = 8;
  const x = point.x * CELL_SIZE + inset;
  const y = point.y * CELL_SIZE + inset;
  const size = CELL_SIZE - inset * 2;
  roundedRect(x, y, size, size, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}
function drawFoodItem(item) {
  if (!item) {
    return;
  }
  const color =
    item.type === "spark" ? COLORS.spark :
    item.type === "prism" ? COLORS.prism :
    item.type === "shield" ? COLORS.shield :
    item.type === "slow" ? COLORS.slow :
    COLORS.fruit;
  const centerX = (item.x + 0.5) * CELL_SIZE;
  const centerY = (item.y + 0.5) * CELL_SIZE;
  const pulse = 1 + Math.sin(performance.now() / 120) * 0.07;
  const now = performance.now();
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = item.type === "fruit" ? 14 : 24;

  if (item.type === "shield") {
    const glowPulse = 0.85 + 0.15 * Math.sin(now / 200);
    const r = CELL_SIZE * 0.3 * pulse * glowPulse;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = centerX + r * Math.cos(angle);
      const py = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 4, CELL_SIZE * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.type === "slow") {
    const r = CELL_SIZE * 0.27 * pulse;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    const barW = r * 0.7;
    const barH = 2.5;
    ctx.fillRect(centerX - barW / 2, centerY - 4, barW, barH);
    ctx.fillRect(centerX - barW / 2, centerY + 2, barW, barH);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 5, CELL_SIZE * 0.06, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, CELL_SIZE * 0.27 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(centerX - 4, centerY - 5, CELL_SIZE * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawEyes(head) {
  const centerX = (head.x + 0.5) * CELL_SIZE;
  const centerY = (head.y + 0.5) * CELL_SIZE;
  const offsetX = state.direction.x * 5;
  const offsetY = state.direction.y * 5;
  const sideX = state.direction.y * 5;
  const sideY = -state.direction.x * 5;
  ctx.fillStyle = "#101216";
  ctx.beginPath();
  ctx.arc(centerX + offsetX + sideX, centerY + offsetY + sideY, 3.2, 0, Math.PI * 2);
  ctx.arc(centerX + offsetX - sideX, centerY + offsetY - sideY, 3.2, 0, Math.PI * 2);
  ctx.fill();
}
function drawSnake() {
  state.snake.forEach(function (part, index) {
    const isHead = index === 0;
    const shade = index % 2 === 0 ? COLORS.snake : COLORS.snakeDark;
    ctx.save();
    ctx.shadowColor = isHead ? COLORS.snake : "transparent";
    ctx.shadowBlur = isHead ? 18 : 0;
    drawCell(part, isHead ? COLORS.head : shade, isHead ? 3 : 4, isHead ? 9 : 7);
    ctx.restore();
    if (isHead) {
      drawEyes(part);
    }
  });
}
function drawObstacles() {
  state.obstacles.forEach(function (block) {
    drawCell(block, COLORS.wall, 5, 6);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}
function drawEffects() {
  state.particles.forEach(function (particle) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3.2 * alpha, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  state.floatingTexts.forEach(function (item) {
    const alpha = Math.max(0, item.life / item.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = item.color;
    ctx.font = "800 22px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.text, item.x, item.y);
  });
  ctx.globalAlpha = 1;
}
function drawTrail(state) {
  if (state.state !== "running" || state.trailHistory.length < 2) return;
  const alphas = [0.25, 0.15, 0.08];
  const indices = [1, 3, 5];
  for (let i = 0; i < indices.length; i++) {
    const idx = indices[i];
    if (idx >= state.trailHistory.length) break;
    const pos = state.trailHistory[idx];
    const inset = 5;
    const x = pos.x * CELL_SIZE + inset;
    const y = pos.y * CELL_SIZE + inset;
    const size = CELL_SIZE - inset * 2;
    ctx.globalAlpha = alphas[i];
    ctx.fillStyle = COLORS.snake;
    roundedRect(x, y, size, size, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function drawComboPulse(state) {
  const combo = getActiveCombo(state);
  if (combo < 4) return;
  const intensity = (combo - 3) / 13;
  const alpha = Math.min(0.45, intensity * (0.7 + 0.3 * Math.sin(performance.now() / 300)));
  const edgeSize = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.08;
  const t = Math.min(1, (combo - 4) / 8);
  const r = Math.round(92 + t * 167);
  const g = Math.round(242 - t * 33);
  const b = Math.round(139 - t * 47);
  const color = "rgba(" + r + "," + g + "," + b + ",";
  const topGrad = ctx.createLinearGradient(0, 0, 0, edgeSize);
  topGrad.addColorStop(0, color + alpha + ")");
  topGrad.addColorStop(1, "transparent");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, edgeSize);
  const botGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT, 0, CANVAS_HEIGHT - edgeSize);
  botGrad.addColorStop(0, color + alpha + ")");
  botGrad.addColorStop(1, "transparent");
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, CANVAS_HEIGHT - edgeSize, CANVAS_WIDTH, edgeSize);
  const leftGrad = ctx.createLinearGradient(0, 0, edgeSize, 0);
  leftGrad.addColorStop(0, color + alpha + ")");
  leftGrad.addColorStop(1, "transparent");
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 0, edgeSize, CANVAS_HEIGHT);
  const rightGrad = ctx.createLinearGradient(CANVAS_WIDTH, 0, CANVAS_WIDTH - edgeSize, 0);
  rightGrad.addColorStop(0, color + alpha + ")");
  rightGrad.addColorStop(1, "transparent");
  ctx.fillStyle = rightGrad;
  ctx.fillRect(CANVAS_WIDTH - edgeSize, 0, edgeSize, CANVAS_HEIGHT);
}
function drawHueShift(state) {
  if (performance.now() >= state.hueShiftUntil) return;
  const remaining = state.hueShiftUntil - performance.now();
  const progress = 1 - remaining / CONFIG.HUE_SHIFT_DURATION;
  const alpha = 0.12 * (1 - progress);
  ctx.fillStyle = "rgba(169,139,255," + alpha + ")";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}
function drawCountdownTimers(state) {
  const now = performance.now();
  const timers = [];
  if (now < state.multiplierUntil) {
    timers.push({ label: "×2 得分", remain: state.multiplierUntil - now, total: CONFIG.PRISM_DURATION_MS, color: COLORS.prism });
  }
  if (now < state.shieldUntil) {
    timers.push({ label: "护盾", remain: state.shieldUntil - now, total: CONFIG.SHIELD_DURATION_MS, color: COLORS.shield });
  }
  if (now < state.slowUntil) {
    timers.push({ label: "缓速", remain: state.slowUntil - now, total: CONFIG.SLOW_DURATION_MS, color: COLORS.slow });
  }
  if (timers.length === 0) return;
  const padding = 12;
  const barWidth = 100;
  const barHeight = 6;
  const rowHeight = 32;
  const startX = CANVAS_WIDTH - padding - barWidth;
  let startY = padding;
  timers.forEach(function (t) {
    const secs = Math.ceil(t.remain / 1000);
    const frac = t.remain / t.total;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    roundedRect(startX, startY + 18, barWidth, barHeight, 3);
    ctx.fill();
    ctx.fillStyle = t.color;
    roundedRect(startX, startY + 18, barWidth * frac, barHeight, 3);
    ctx.fill();
    ctx.font = "700 13px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillStyle = t.color;
    ctx.fillText(t.label + " " + secs + "s", startX + barWidth, startY + 14);
    startY += rowHeight;
  });
}
function render() {
  drawBoard();
  drawFoodItem(state.food);
  drawFoodItem(state.specialFood);
  drawObstacles();
  drawTrail(state);
  drawSnake();
  drawEffects();
  drawComboPulse(state);
  drawHueShift(state);
  drawCountdownTimers(state);
}

function spawnObstaclePack() {
  const diff = CONFIG.DIFFICULTIES[state.difficulty];
  const targetCount = Math.min(CONFIG.OBSTACLE_MAX, CONFIG.OBSTACLE_BASE + state.level * CONFIG.OBSTACLE_PER_LEVEL + diff.obstacleOffset);
  while (state.obstacles.length < targetCount) {
    const block = spawnItem(state, "wall");
    const nearHead = Math.abs(block.x - state.snake[0].x) + Math.abs(block.y - state.snake[0].y) < CONFIG.OBSTACLE_SAFE_DISTANCE;
    if (!nearHead) {
      state.obstacles.push(block);
    }
  }
}
function nextStepInterval() {
  const diff = CONFIG.DIFFICULTIES[state.difficulty];
  const base = diff.baseInterval - Math.min(CONFIG.SPEED_REDUCTION_CAP, (state.level - 1) * diff.speedPerLevel);
  const rushBoost = state.rush >= 100 ? CONFIG.RUSH_SPEED_BOOST : 0;
  const interval = Math.max(CONFIG.MIN_INTERVAL, base - rushBoost);
  return performance.now() < state.slowUntil ? interval * CONFIG.SLOW_SPEED_FACTOR : interval;
}
function collectFood(item, type) {
  const multiplier = state.multiplierTicks > 0 ? 2 : 1;
  const basePoints =
    type === "fruit" ? CONFIG.SCORE_FRUIT :
    type === "spark" ? CONFIG.SCORE_SPARK :
    type === "prism" ? CONFIG.SCORE_PRISM :
    type === "shield" ? CONFIG.SCORE_SHIELD :
    CONFIG.SCORE_SLOW;
  const gained = Math.round(basePoints * Math.max(1, state.combo) * multiplier);
  state.score += gained;
  state.combo = Math.min(CONFIG.COMBO_MAX, state.combo + (type === "fruit" ? CONFIG.COMBO_FRUIT_GAIN : CONFIG.COMBO_SPARK_GAIN));
  state.rush = Math.min(100, state.rush + (type === "fruit" ? CONFIG.RUSH_FRUIT_GAIN : CONFIG.RUSH_SPECIAL_GAIN));
  if (type === "spark") {
    state.rush = 100;
    state.everRushed = true;
  }
  if (type === "prism") {
    state.multiplierUntil = performance.now() + CONFIG.PRISM_DURATION_MS;
    state.hueShiftUntil = performance.now() + CONFIG.HUE_SHIFT_DURATION;
  }
  if (type === "shield") {
    state.shieldUntil = performance.now() + CONFIG.SHIELD_DURATION_MS;
  }
  if (type === "slow") {
    state.slowUntil = performance.now() + CONFIG.SLOW_DURATION_MS;
  }
  if (type === "fruit") {
    state.fruitCount += 1;
  } else if (type === "spark") {
    state.sparkCount += 1;
  } else if (type === "prism") {
    state.prismCount += 1;
  } else if (type === "shield") {
    state.shieldCount += 1;
  } else if (type === "slow") {
    state.slowCount += 1;
  }
  state.maxCombo = Math.max(state.maxCombo, getActiveCombo(state));
  const color =
    type === "fruit" ? COLORS.fruit :
    type === "spark" ? COLORS.spark :
    type === "prism" ? COLORS.prism :
    type === "shield" ? COLORS.shield :
    COLORS.slow;
  const particleCount = type === "fruit" ? CONFIG.PARTICLE_FRUIT_COUNT : CONFIG.PARTICLE_SPECIAL_COUNT;
  burst(item, color, particleCount);
  floatText(item, "+" + gained, color);
  playTone(type);
}
function moveSnake() {
  state.direction = state.nextDirection;
  const head = {
    x: state.snake[0].x + state.direction.x,
    y: state.snake[0].y + state.direction.y
  };

  const hitWall = head.x < 0 || head.x >= CONFIG.BOARD_COLUMNS || head.y < 0 || head.y >= CONFIG.BOARD_ROWS;
  const hitSelfIndex = state.snake.findIndex(function (part, index) {
    return index > 0 && part.x === head.x && part.y === head.y;
  });
  const hitSelf = hitSelfIndex >= 0;
  const hitObstacleIndex = state.obstacles.findIndex(function (block) {
    return block.x === head.x && block.y === head.y;
  });
  const hitObstacle = hitObstacleIndex >= 0;

  if (hitWall || hitSelf || hitObstacle) {
    if (performance.now() < state.shieldUntil) {
      if (hitObstacle) {
        state.obstacles.splice(hitObstacleIndex, 1);
      } else if (hitSelf && hitSelfIndex > 1) {
        state.snake.splice(hitSelfIndex);
      } else {
        return { gameOver: true };
      }
      playShieldHit();
    } else {
      return { gameOver: true };
    }
  }

  state.snake.unshift(head);

  state.trailHistory.unshift({ x: head.x, y: head.y });
  if (state.trailHistory.length > CONFIG.TRAIL_LENGTH) {
    state.trailHistory.length = CONFIG.TRAIL_LENGTH;
  }

  var grew = false;
  if (head.x === state.food.x && head.y === state.food.y) {
    collectFood(state.food, "fruit");
    state.food = spawnItem(state, "fruit");
    grew = true;
  }
  if (state.specialFood && head.x === state.specialFood.x && head.y === state.specialFood.y) {
    collectFood(state.specialFood, state.specialFood.type);
    state.specialFood = null;
    grew = true;
  }
  if (!grew) {
    state.snake.pop();
    state.combo = Math.max(1, state.combo - CONFIG.DIFFICULTIES[state.difficulty].comboDecay);
    state.rush = Math.max(0, state.rush - CONFIG.RUSH_DECAY);
  }
  state.level = Math.max(1, Math.floor(state.score / CONFIG.SCORE_PER_LEVEL) + 1);
  state.maxLevel = Math.max(state.maxLevel, state.level);
  if (state.level >= CONFIG.DIFFICULTIES[state.difficulty].obstacleStartLevel) {
    spawnObstaclePack();
  }
  if (!state.specialFood && Math.random() < (CONFIG.SPECIAL_SPAWN_BASE + state.level * CONFIG.SPECIAL_SPAWN_PER_LEVEL) * CONFIG.DIFFICULTIES[state.difficulty].specialSpawnMultiplier) {
    const roll = Math.random();
    let type;
    if (roll < CONFIG.SPECIAL_SPARK_CHANCE) {
      type = "spark";
    } else if (roll < CONFIG.SPECIAL_SPARK_CHANCE + CONFIG.SPECIAL_PRISM_CHANCE) {
      type = "prism";
    } else if (roll < CONFIG.SPECIAL_SPARK_CHANCE + CONFIG.SPECIAL_PRISM_CHANCE + CONFIG.SPECIAL_SHIELD_CHANCE) {
      type = "shield";
    } else {
      type = "slow";
    }
    state.specialFood = spawnItem(state, type);
  }
  return null;
}
function getDifficultyTitle() {
  if (state.difficulty === "easy") return "SerpentRush · 休闲模式";
  if (state.difficulty === "hard") return "SerpentRush · 硬核模式";
  return "SerpentRush · 标准模式";
}
function applyDifficulty(name) {
  if (!CONFIG.DIFFICULTIES[name]) return;
  state.difficulty = name;
  state.best = readBestScore(name);
}
function setDirection(name) {
  const wanted = DIRECTIONS[name];
  if (!wanted || state.state === "gameover") {
    return;
  }
  if (wanted.x + state.direction.x === 0 && wanted.y + state.direction.y === 0) {
    return;
  }
  state.nextDirection = wanted;
}

function showAchievementToast(ach) {
  var container = document.querySelector(".achieve-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "achieve-toast-container";
    document.body.appendChild(container);
  }
  if (container.children.length >= 2) {
    container.firstChild.remove();
  }
  var toast = document.createElement("div");
  toast.className = "achieve-toast";
  toast.innerHTML = '<div class="achieve-toast-icon" style="background:' + ach.color + '22;color:' + ach.color + '">' + ach.icon + '</div>'
    + '<div class="achieve-toast-body"><strong>' + ach.name + '</strong><span>' + ach.desc + '</span></div>';
  container.appendChild(toast);
  setTimeout(function () {
    if (toast.parentNode) toast.remove();
  }, 3200);
}
function updateAchieveCount() {
  var el = document.querySelector("#achieveCount");
  if (el) el.textContent = Object.keys(state.achievements).length + "/12";
}
function checkAchievements() {
  ACHIEVEMENTS.forEach(function (ach) {
    if (state.achievements[ach.id]) return;
    var unlocked = false;
    switch (ach.id) {
      case "first_score":   unlocked = state.score >= 50; break;
      case "first_combo":   unlocked = getActiveCombo(state) >= 3; break;
      case "first_rush":    unlocked = state.everRushed; break;
      case "combo_master":  unlocked = getActiveCombo(state) >= 6; break;
      case "prism_hunter":  unlocked = state.prismCount >= 5; break;
      case "survivor_3min": unlocked = state.roundElapsed >= 180000; break;
      case "fruit_feast":   unlocked = state.fruitCount >= 50; break;
      case "score_200":     unlocked = state.score >= 200; break;
      case "score_500":     unlocked = state.score >= 500; break;
      case "level_10":      unlocked = state.level >= 10; break;
      case "spark_addict":  unlocked = state.sparkCount >= 8; break;
      case "perfectionist": unlocked = state.earlySurvived && state.score >= 80; break;
    }
    if (unlocked) {
      state.achievements[ach.id] = true;
      state.achievementsNew.push(ach.id);
      saveAchievements(state.achievements);
      showAchievementToast(ach);
    }
  });
  updateAchieveCount();
}
function renderAchievePanel(filter) {
  var achieveList = document.querySelector("#achieveList");
  if (!achieveList) return;
  filter = filter || "全部";
  var achieveFilters = document.querySelectorAll(".achieve-filter-btn");
  var activeFilterBtn = document.querySelector(".achieve-filter-btn.is-active");
  if (activeFilterBtn) activeFilterBtn.classList.remove("is-active");
  achieveFilters.forEach(function (btn) {
    if (btn.dataset.filter === filter) btn.classList.add("is-active");
  });
  achieveList.innerHTML = "";
  ACHIEVEMENTS.forEach(function (ach) {
    if (filter !== "全部" && ach.category !== filter) return;
    var unlocked = !!state.achievements[ach.id];
    var item = document.createElement("div");
    item.className = "achieve-item" + (unlocked ? " is-unlocked" : "");
    item.innerHTML = '<span class="achieve-item-icon" style="background:' + ach.color + '22;color:' + ach.color + '">'
      + ach.icon + '</span>'
      + '<span class="achieve-item-body">'
      + '<strong>' + ach.name + '</strong>'
      + '<span>' + ach.desc + '</span>'
      + '</span>'
      + '<span class="achieve-item-status">' + (unlocked ? "✓" : "🔒") + '</span>';
    achieveList.appendChild(item);
  });
  updateAchieveCount();
}

// ===== HUD =====
function formatCombo(value) {
  return value.toFixed(1).replace(/\.0$/, "");
}
function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) {
    return seconds + " 秒";
  }
  return minutes + ":" + String(seconds).padStart(2, "0");
}
function updateHud() {
  const comboText = formatCombo(getActiveCombo(state));
  document.querySelector("#scoreValue").textContent = state.score;
  document.querySelector("#bestValue").textContent = Math.max(state.best, state.score);
  document.querySelector("#comboValue").textContent = "x" + comboText;
  document.querySelector("#levelValue").textContent = state.level;
  document.querySelector("#rushLabel").textContent = Math.round(state.rush) + "%";
  document.querySelector("#rushMeter").style.width = Math.min(100, state.rush) + "%";
  document.querySelector("#pauseButton").textContent = state.state === "paused" ? "继续" : "暂停";
  document.querySelector("#musicButton").textContent = state.musicEnabled ? "音乐 开" : "音乐 关";
}
function updateStatus(text) {
  document.querySelector("#statusPill").textContent = text;
}
// ===== AUDIO =====
function toggleMusic() {
  unlockAudio();
  state.musicEnabled = !state.musicEnabled;
  if (state.musicEnabled && state.state === "running") {
    startMusic();
  } else {
    stopMusic();
  }
  updateHud();
}
// ===== OVERLAYS =====
function showOverlay(label, title, copy, buttonText) {
  var overlay = document.querySelector("#overlay");
  document.querySelector("#overlayLabel").textContent = label;
  document.querySelector("#overlayTitle").textContent = title;
  document.querySelector("#overlayCopy").textContent = copy;
  var roundSummary = document.querySelector("#roundSummary");
  roundSummary.classList.add("is-hidden");
  roundSummary.replaceChildren();
  document.querySelector("#startButton").textContent = buttonText;
  var difficultySelector = document.querySelector("#difficultySelector");
  if (difficultySelector) {
    difficultySelector.classList.toggle("is-hidden", label !== "准备");
  }
  overlay.classList.remove("is-hidden");
}
function showGameOverOverlay() {
  const summaryItems = [
    ["最高连击", "x" + formatCombo(state.maxCombo)],
    ["吃到果实", state.fruitCount],
    ["最高等级", state.maxLevel],
    ["存活时间", formatDuration(state.roundElapsed)],
    ["电光", state.sparkCount],
    ["棱晶", state.prismCount]
  ];
  document.querySelector("#overlayLabel").textContent = "游戏结束";
  document.querySelector("#overlayTitle").textContent = state.score + " 分";
  document.querySelector("#overlayCopy").textContent = "本局表现已经记录，看看哪一项还能再往上冲。";
  var roundSummary = document.querySelector("#roundSummary");
  roundSummary.replaceChildren.apply(roundSummary, summaryItems.map(function (pair) {
    var item = document.createElement("div");
    var itemLabel = document.createElement("span");
    var itemValue = document.createElement("strong");
    item.className = "summary-item";
    itemLabel.textContent = pair[0];
    itemValue.textContent = pair[1];
    item.append(itemLabel, itemValue);
    return item;
  }));
  roundSummary.classList.remove("is-hidden");
  document.querySelector("#startButton").textContent = "重新开始";
  var difficultySelector = document.querySelector("#difficultySelector");
  if (difficultySelector) {
    difficultySelector.classList.remove("is-hidden");
  }
  document.querySelector("#overlay").classList.remove("is-hidden");
}
function hideOverlay() {
  document.querySelector("#overlay").classList.add("is-hidden");
}
// ===== MODALS =====
function openHelp() {
  state.helpPreviousState = state.state;
  if (state.state === "running") {
    state.state = "paused";
    stopMusic();
    updateStatus("看说明");
    updateHud();
  }
  document.querySelector("#helpModal").classList.remove("is-hidden");
  document.querySelector("#closeHelpButton").focus();
}
function closeHelp() {
  document.querySelector("#helpModal").classList.add("is-hidden");
  if (state.helpPreviousState === "running" && state.state === "paused") {
    state.state = "running";
    state.lastTime = performance.now();
    updateStatus("进行中");
    startMusic();
  } else if (state.state === "paused") {
    updateStatus("已暂停");
  }
  updateHud();
  document.querySelector("#helpButton").focus();
  state.helpPreviousState = null;
}
function openAchieve() {
  renderAchievePanel("全部");
  document.querySelector("#achieveModal").classList.remove("is-hidden");
  document.querySelector("#closeAchieveButton").focus();
}
function closeAchieve() {
  document.querySelector("#achieveModal").classList.add("is-hidden");
}
// ===== THEMES =====
function applyShellBackground() {
  var gameStage = document.querySelector(".game-stage");
  SHELL_BACKGROUNDS.forEach(function (bg) { gameStage.classList.remove(bg.cls); });
  var current = SHELL_BACKGROUNDS[state.shellBgIndex];
  gameStage.classList.add(current.cls);
  document.querySelector("#shellBgName").textContent = current.name;
}
function applyBoardBackground() {
  document.querySelector("#boardBgName").textContent = BOARD_BG_NAMES[BOARD_BACKGROUNDS[state.boardBgIndex]];
}
function cycleShellBackground() {
  state.shellBgIndex = (state.shellBgIndex + 1) % 6;
  saveShellBg(state.shellBgIndex);
  applyShellBackground();
}
function cycleBoardBackground() {
  state.boardBgIndex = (state.boardBgIndex + 1) % 5;
  saveBoardBg(state.boardBgIndex);
  applyBoardBackground();
  invalidateBgCache();
}
function updateDifficultyUI(name) {
  var diffBadge = document.querySelector("#diffBadge");
  if (diffBadge) {
    diffBadge.textContent = CONFIG.DIFFICULTIES[name].badge;
    diffBadge.className = "diff-badge diff-badge--" + name;
  }
  var overlay = document.querySelector("#overlay");
  if (!overlay.classList.contains("is-hidden")) {
    var titleEl = document.querySelector("#overlayTitle");
    if (titleEl) {
      if (name === "easy") titleEl.textContent = "SerpentRush · 休闲模式";
      else if (name === "hard") titleEl.textContent = "SerpentRush · 硬核模式";
      else titleEl.textContent = "SerpentRush · 标准模式";
    }
  }
}

function setupTouchInput(onStart) {
  document.querySelectorAll("[data-dir]").forEach(function (button) {
    button.addEventListener("click", function () {
      unlockAudio();
      setDirection(button.dataset.dir);
      if (onStart) onStart();
    });
  });
}

// ===== DOM ELEMENTS =====
const startButton = document.querySelector("#startButton");
const helpButton = document.querySelector("#helpButton");
const helpModal = document.querySelector("#helpModal");
const closeHelpButton = document.querySelector("#closeHelpButton");
const confirmHelpButton = document.querySelector("#confirmHelpButton");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");
const musicButton = document.querySelector("#musicButton");
const shellBgBtn = document.querySelector("#shellBgBtn");
const boardBgBtn = document.querySelector("#boardBgBtn");
const achieveBtn = document.querySelector("#achieveBtn");
const achieveModal = document.querySelector("#achieveModal");
const closeAchieveButton = document.querySelector("#closeAchieveButton");
const itemGuideBtn = document.querySelector("#itemGuideBtn");
const itemGuideModal = document.querySelector("#itemGuideModal");
const closeItemGuideButton = document.querySelector("#closeItemGuideButton");
const confirmItemGuideButton = document.querySelector("#confirmItemGuideButton");
const difficultySelector = document.querySelector("#difficultySelector");
// ===== GAME FLOW =====
function setDifficulty(name) {
  applyDifficulty(name);
  updateHud();
  updateDifficultyUI(name);
}
function resetGame() {
  stopMusic();
  state.reset();
  updateHud();
  showOverlay("准备", getDifficultyTitle(), "收集发光果实，叠加连击，在加速狂潮中坚持更久。", "开始游戏");
}
function startGame() {
  if (state.state === "running") {
    return;
  }
  if (state.state === "gameover") {
    resetGame();
  }
  state.state = "running";
  state.lastTime = performance.now();
  hideOverlay();
  updateStatus("进行中");
  startMusic();
}
function pauseGame() {
  if (state.state === "running") {
    state.state = "paused";
    stopMusic();
    showOverlay("暂停", "稍作休整", "本局游戏会停在当前位置，准备好就继续冲刺。", "继续游戏");
    updateStatus("已暂停");
  } else if (state.state === "paused") {
    startGame();
  }
}
function gameOver() {
  state.state = "gameover";
  stopMusic();
  state.best = Math.max(state.best, state.score);
  saveBestScore(state.best, state.difficulty);
  burst(state.snake[0], COLORS.fruit, CONFIG.PARTICLE_GAMEOVER_COUNT);
  showGameOverOverlay();
  updateStatus("撞到了");
  updateHud();
}
// ===== GAME LOOP =====
function tick(time) {
  const delta = Math.min(60, time - state.lastTime);
  state.lastTime = time;
  if (state.state === "running") {
    state.roundElapsed += delta;
    if (!state.earlySurvived && state.roundElapsed >= 30000) {
      state.earlySurvived = true;
      checkAchievements();
    }
    state.moveTimer += delta;
    if (state.moveTimer >= nextStepInterval()) {
      state.moveTimer = 0;
      var result = moveSnake();
      if (result && result.gameOver) {
        gameOver();
      } else {
        checkAchievements();
        updateHud();
      }
    }
  }
  updateEffects(delta);
  render();
  requestAnimationFrame(tick);
}
// ===== INPUT (Keyboard) =====
window.addEventListener("keydown", function (event) {
  if (!achieveModal.classList.contains("is-hidden")) {
    if (event.code === "Escape") {
      event.preventDefault();
      closeAchieve();
    }
    return;
  }
  if (!itemGuideModal.classList.contains("is-hidden")) {
    if (event.code === "Escape") {
      event.preventDefault();
      itemGuideModal.classList.add("is-hidden");
    }
    return;
  }
  if (!helpModal.classList.contains("is-hidden")) {
    if (event.code === "Escape") {
      event.preventDefault();
      closeHelp();
    }
    return;
  }
  const keyMap = {
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right"
  };
  if (keyMap[event.code]) {
    event.preventDefault();
    unlockAudio();
    setDirection(keyMap[event.code]);
    if (state.state === "ready") {
      startGame();
    }
  }
  if (event.code === "Space") {
    event.preventDefault();
    unlockAudio();
    pauseGame();
  }
  if (event.code === "Enter") {
    event.preventDefault();
    unlockAudio();
    startGame();
  }
});
// ===== BUTTON EVENTS =====
startButton.addEventListener("click", function () {
  unlockAudio();
  startGame();
});
helpButton.addEventListener("click", function () {
  openHelp();
});
closeHelpButton.addEventListener("click", function () {
  closeHelp();
});
confirmHelpButton.addEventListener("click", function () {
  closeHelp();
});
helpModal.addEventListener("click", function (event) {
  if (event.target === helpModal) {
    closeHelp();
  }
});
pauseButton.addEventListener("click", function () {
  unlockAudio();
  pauseGame();
});
restartButton.addEventListener("click", function () {
  unlockAudio();
  resetGame();
  startGame();
});
musicButton.addEventListener("click", function () {
  toggleMusic();
});
shellBgBtn.addEventListener("click", function () {
  cycleShellBackground();
});
boardBgBtn.addEventListener("click", function () {
  cycleBoardBackground();
});
achieveBtn.addEventListener("click", function () {
  openAchieve();
});
closeAchieveButton.addEventListener("click", function () {
  closeAchieve();
});
achieveModal.addEventListener("click", function (event) {
  if (event.target === achieveModal) {
    closeAchieve();
  }
});
itemGuideBtn.addEventListener("click", function () {
  itemGuideModal.classList.remove("is-hidden");
  closeItemGuideButton.focus();
});
closeItemGuideButton.addEventListener("click", function () {
  itemGuideModal.classList.add("is-hidden");
});
confirmItemGuideButton.addEventListener("click", function () {
  itemGuideModal.classList.add("is-hidden");
});
itemGuideModal.addEventListener("click", function (event) {
  if (event.target === itemGuideModal) {
    itemGuideModal.classList.add("is-hidden");
  }
});
document.querySelectorAll(".achieve-filter-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    renderAchievePanel(btn.dataset.filter);
  });
});
if (difficultySelector) {
  difficultySelector.addEventListener("click", function (event) {
    var btn = event.target.closest(".diff-btn");
    if (!btn) return;
    var diffName = btn.dataset.diff;
    if (!diffName) return;
    difficultySelector.querySelectorAll(".diff-btn").forEach(function (b) {
      b.classList.remove("is-active");
    });
    btn.classList.add("is-active");
    difficultySelector.setAttribute("data-active", diffName);
    setDifficulty(diffName);
  });
}
// ===== TOUCH INPUT =====
setupTouchInput(function () {
  if (state.state === "ready") {
    startGame();
  }
});
// ===== INIT =====
resetGame();
loadBgPreferences(state);
applyShellBackground();
applyBoardBackground();
updateAchieveCount();
var diffBadge = document.querySelector("#diffBadge");
if (diffBadge) {
  diffBadge.textContent = "标准";
  diffBadge.className = "diff-badge diff-badge--normal";
}
if (difficultySelector) {
  difficultySelector.setAttribute("data-active", "normal");
}
requestAnimationFrame(tick);

})();
