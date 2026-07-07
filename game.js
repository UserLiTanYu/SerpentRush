(() => {
  "use strict";

  // ===== CONFIG =====
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
    SCORE_PER_LEVEL: 80,
    RUSH_FRUIT_GAIN: 12,
    RUSH_SPECIAL_GAIN: 24,
    RUSH_DECAY: 0.5,
    RUSH_SPEED_BOOST: 32,
    PRISM_MULTIPLIER_TICKS: 50,
    OBSTACLE_START_LEVEL: 2,
    OBSTACLE_BASE: 4,
    OBSTACLE_PER_LEVEL: 2,
    OBSTACLE_MAX: 24,
    OBSTACLE_SAFE_DISTANCE: 6,
    SPECIAL_SPAWN_BASE: 0.035,
    SPECIAL_SPAWN_PER_LEVEL: 0.004,
    SPECIAL_SPARK_CHANCE: 0.56,
    BASE_INTERVAL: 150,
    SPEED_PER_LEVEL: 9,
    SPEED_REDUCTION_CAP: 72,
    MIN_INTERVAL: 54,
    PARTICLE_FRUIT_COUNT: 14,
    PARTICLE_SPECIAL_COUNT: 28,
    PARTICLE_GAMEOVER_COUNT: 28,
    TONE_FRUIT_HZ: 360,
    TONE_SPARK_HZ: 580,
    TONE_PRISM_HZ: 720,
    MUSIC_BPM: 126,
    MUSIC_SCHEDULE_INTERVAL: 260,
  };

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
  let ctx = canvas.getContext("2d");
  const CANVAS_WIDTH = canvas.width;
  const CANVAS_HEIGHT = canvas.height;
  const CELL_SIZE = Math.min(CANVAS_WIDTH / CONFIG.BOARD_COLUMNS, CANVAS_HEIGHT / CONFIG.BOARD_ROWS);

  // ===== BACKGROUND CACHE =====
  let bgCache = null;
  let bgCacheKey = null;
  const supportsOffscreen = typeof OffscreenCanvas !== "undefined";

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

  // ===== DOM ELEMENTS =====
  const scoreValue = document.querySelector("#scoreValue");
  const bestValue = document.querySelector("#bestValue");
  const comboValue = document.querySelector("#comboValue");
  const levelValue = document.querySelector("#levelValue");
  const statusPill = document.querySelector("#statusPill");
  const rushLabel = document.querySelector("#rushLabel");
  const rushMeter = document.querySelector("#rushMeter");
  const overlay = document.querySelector("#overlay");
  const overlayLabel = document.querySelector("#overlayLabel");
  const overlayTitle = document.querySelector("#overlayTitle");
  const overlayCopy = document.querySelector("#overlayCopy");
  const roundSummary = document.querySelector("#roundSummary");
  const startButton = document.querySelector("#startButton");
  const helpButton = document.querySelector("#helpButton");
  const helpModal = document.querySelector("#helpModal");
  const closeHelpButton = document.querySelector("#closeHelpButton");
  const confirmHelpButton = document.querySelector("#confirmHelpButton");
  const pauseButton = document.querySelector("#pauseButton");
  const restartButton = document.querySelector("#restartButton");
  const musicButton = document.querySelector("#musicButton");
  const shellBgName = document.querySelector("#shellBgName");
  const boardBgName = document.querySelector("#boardBgName");
  const shellBgBtn = document.querySelector("#shellBgBtn");
  const boardBgBtn = document.querySelector("#boardBgBtn");
  const gameStage = document.querySelector(".game-stage");

  // ===== GAME STATE =====
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

  function readBestScore() {
    return Number(localStorage.getItem("serpentRushBest") || "0");
  }

  function saveBestScore(value) {
    localStorage.setItem("serpentRushBest", String(value));
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
      this.lastTime = performance.now();
      this.state = "ready";
      this.particles = [];
      this.floatingTexts = [];
      this.best = readBestScore();
      this.food = spawnItem(this, "fruit");
      this.specialFood = null;
    }
  }

  const state = new GameState();

  // ===== AUDIO =====
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
    const frequency = type === "fruit" ? CONFIG.TONE_FRUIT_HZ : type === "spark" ? CONFIG.TONE_SPARK_HZ : CONFIG.TONE_PRISM_HZ;
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
      window.setTimeout(() => gainToStop.disconnect(), 260);
    }

    state.musicGain = null;
  }

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

  // ===== EFFECTS =====
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

  // ===== RENDERER =====
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

  function drawCell(point, fill, inset = 4, radius = 8) {
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
    const color = item.type === "spark" ? COLORS.spark : item.type === "prism" ? COLORS.prism : COLORS.fruit;
    const centerX = (item.x + 0.5) * CELL_SIZE;
    const centerY = (item.y + 0.5) * CELL_SIZE;
    const pulse = 1 + Math.sin(performance.now() / 120) * 0.07;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = item.type === "fruit" ? 14 : 24;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, CELL_SIZE * 0.27 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(centerX - 4, centerY - 5, CELL_SIZE * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSnake() {
    state.snake.forEach((part, index) => {
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

  function drawObstacles() {
    state.obstacles.forEach((block) => {
      drawCell(block, COLORS.wall, 5, 6);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  function drawEffects() {
    state.particles.forEach((particle) => {
      const alpha = Math.max(0, particle.life / particle.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 3.2 * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    state.floatingTexts.forEach((item) => {
      const alpha = Math.max(0, item.life / item.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = item.color;
      ctx.font = "800 22px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.text, item.x, item.y);
    });
    ctx.globalAlpha = 1;
  }

  function render() {
    drawBoard();
    drawFoodItem(state.food);
    drawFoodItem(state.specialFood);
    drawObstacles();
    drawSnake();
    drawEffects();
  }

  // ===== UI =====
  function formatCombo(value) {
    return value.toFixed(1).replace(/\.0$/, "");
  }

  function formatDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes <= 0) {
      return `${seconds} 秒`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function updateHud() {
    const comboText = formatCombo(getActiveCombo(state));
    scoreValue.textContent = state.score;
    bestValue.textContent = Math.max(state.best, state.score);
    comboValue.textContent = `x${comboText}`;
    levelValue.textContent = state.level;
    rushLabel.textContent = `${Math.round(state.rush)}%`;
    rushMeter.style.width = `${Math.min(100, state.rush)}%`;
    pauseButton.textContent = state.state === "paused" ? "继续" : "暂停";
    musicButton.textContent = state.musicEnabled ? "音乐 开" : "音乐 关";
  }

  function updateStatus(text) {
    statusPill.textContent = text;
  }

  function showOverlay(label, title, copy, buttonText) {
    overlayLabel.textContent = label;
    overlayTitle.textContent = title;
    overlayCopy.textContent = copy;
    roundSummary.classList.add("is-hidden");
    roundSummary.replaceChildren();
    startButton.textContent = buttonText;
    overlay.classList.remove("is-hidden");
  }

  function showGameOverOverlay() {
    const summaryItems = [
      ["最高连击", `x${formatCombo(state.maxCombo)}`],
      ["吃到果实", state.fruitCount],
      ["最高等级", state.maxLevel],
      ["存活时间", formatDuration(state.roundElapsed)],
      ["电光", state.sparkCount],
      ["棱晶", state.prismCount]
    ];

    overlayLabel.textContent = "游戏结束";
    overlayTitle.textContent = `${state.score} 分`;
    overlayCopy.textContent = "本局表现已经记录，看看哪一项还能再往上冲。";
    roundSummary.replaceChildren(...summaryItems.map(([label, value]) => {
      const item = document.createElement("div");
      const itemLabel = document.createElement("span");
      const itemValue = document.createElement("strong");
      item.className = "summary-item";
      itemLabel.textContent = label;
      itemValue.textContent = value;
      item.append(itemLabel, itemValue);
      return item;
    }));
    roundSummary.classList.remove("is-hidden");
    startButton.textContent = "重新开始";
    overlay.classList.remove("is-hidden");
  }

  function hideOverlay() {
    overlay.classList.add("is-hidden");
  }

  function applyShellBackground() {
    SHELL_BACKGROUNDS.forEach((bg) => gameStage.classList.remove(bg.cls));
    const current = SHELL_BACKGROUNDS[state.shellBgIndex];
    gameStage.classList.add(current.cls);
    shellBgName.textContent = current.name;
  }

  function applyBoardBackground() {
    boardBgName.textContent = BOARD_BG_NAMES[BOARD_BACKGROUNDS[state.boardBgIndex]];
  }

  function openHelp() {
    state.helpPreviousState = state.state;
    if (state.state === "running") {
      state.state = "paused";
      stopMusic();
      updateStatus("看说明");
      updateHud();
    }
    helpModal.classList.remove("is-hidden");
    closeHelpButton.focus();
  }

  function closeHelp() {
    helpModal.classList.add("is-hidden");
    if (state.helpPreviousState === "running" && state.state === "paused") {
      state.state = "running";
      state.lastTime = performance.now();
      updateStatus("进行中");
      startMusic();
    } else if (state.state === "paused") {
      updateStatus("已暂停");
    }
    updateHud();
    helpButton.focus();
    state.helpPreviousState = null;
  }

  // ===== INPUT =====
  window.addEventListener("keydown", (event) => {
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

  document.querySelectorAll("[data-dir]").forEach((button) => {
    button.addEventListener("click", () => {
      unlockAudio();
      setDirection(button.dataset.dir);
    });
  });

  // ===== GAME LOGIC =====
  function spawnObstaclePack() {
    const targetCount = Math.min(CONFIG.OBSTACLE_MAX, CONFIG.OBSTACLE_BASE + state.level * CONFIG.OBSTACLE_PER_LEVEL);
    while (state.obstacles.length < targetCount) {
      const block = spawnItem(state, "wall");
      const nearHead = Math.abs(block.x - state.snake[0].x) + Math.abs(block.y - state.snake[0].y) < CONFIG.OBSTACLE_SAFE_DISTANCE;
      if (!nearHead) {
        state.obstacles.push(block);
      }
    }
  }

  function nextStepInterval() {
    const base = CONFIG.BASE_INTERVAL - Math.min(CONFIG.SPEED_REDUCTION_CAP, (state.level - 1) * CONFIG.SPEED_PER_LEVEL);
    const rushBoost = state.rush >= 100 ? CONFIG.RUSH_SPEED_BOOST : 0;
    return Math.max(CONFIG.MIN_INTERVAL, base - rushBoost);
  }

  function collectFood(item, type) {
    const multiplier = state.multiplierTicks > 0 ? 2 : 1;
    const points = type === "fruit" ? CONFIG.SCORE_FRUIT : type === "spark" ? CONFIG.SCORE_SPARK : CONFIG.SCORE_PRISM;
    const gained = Math.round(points * Math.max(1, state.combo) * multiplier);

    state.score += gained;
    state.combo = Math.min(CONFIG.COMBO_MAX, state.combo + (type === "fruit" ? CONFIG.COMBO_FRUIT_GAIN : CONFIG.COMBO_SPARK_GAIN));
    state.rush = Math.min(100, state.rush + (type === "fruit" ? CONFIG.RUSH_FRUIT_GAIN : CONFIG.RUSH_SPECIAL_GAIN));

    if (type === "spark") {
      state.rush = 100;
    }
    if (type === "prism") {
      state.multiplierTicks = CONFIG.PRISM_MULTIPLIER_TICKS;
    }

    if (type === "fruit") {
      state.fruitCount += 1;
    } else if (type === "spark") {
      state.sparkCount += 1;
    } else if (type === "prism") {
      state.prismCount += 1;
    }

    state.maxCombo = Math.max(state.maxCombo, getActiveCombo(state));

    const color = type === "fruit" ? COLORS.fruit : type === "spark" ? COLORS.spark : COLORS.prism;
    const particleCount = type === "fruit" ? CONFIG.PARTICLE_FRUIT_COUNT : CONFIG.PARTICLE_SPECIAL_COUNT;
    burst(item, color, particleCount);
    floatText(item, `+${gained}`, color);
    playTone(type);
  }

  function moveSnake() {
    state.direction = state.nextDirection;

    const head = {
      x: state.snake[0].x + state.direction.x,
      y: state.snake[0].y + state.direction.y
    };

    if (
      head.x < 0 || head.x >= CONFIG.BOARD_COLUMNS ||
      head.y < 0 || head.y >= CONFIG.BOARD_ROWS ||
      state.snake.some((part, index) => index > 0 && part.x === head.x && part.y === head.y) ||
      state.obstacles.some((block) => block.x === head.x && block.y === head.y)
    ) {
      gameOver();
      return;
    }

    state.snake.unshift(head);

    let grew = false;
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
      state.combo = Math.max(1, state.combo - CONFIG.COMBO_DECAY);
      state.rush = Math.max(0, state.rush - CONFIG.RUSH_DECAY);
    }

    state.level = Math.max(1, Math.floor(state.score / CONFIG.SCORE_PER_LEVEL) + 1);
    state.maxLevel = Math.max(state.maxLevel, state.level);
    if (state.level >= CONFIG.OBSTACLE_START_LEVEL) {
      spawnObstaclePack();
    }

    if (!state.specialFood && Math.random() < CONFIG.SPECIAL_SPAWN_BASE + state.level * CONFIG.SPECIAL_SPAWN_PER_LEVEL) {
      state.specialFood = spawnItem(state, Math.random() < CONFIG.SPECIAL_SPARK_CHANCE ? "spark" : "prism");
    }

    if (state.multiplierTicks > 0) {
      state.multiplierTicks -= 1;
    }

    updateHud();
  }

  function resetGame() {
    stopMusic();
    state.reset();
    updateHud();
    showOverlay("准备", "SerpentRush", "收集发光果实，叠加连击，在加速狂潮中坚持更久。", "开始游戏");
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
    saveBestScore(state.best);
    burst(state.snake[0], COLORS.fruit, CONFIG.PARTICLE_GAMEOVER_COUNT);
    showGameOverOverlay();
    updateStatus("撞到了");
    updateHud();
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
    if (state.state === "ready") {
      startGame();
    }
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

  // ===== GAME LOOP =====
  function tick(time) {
    const delta = Math.min(60, time - state.lastTime);
    state.lastTime = time;

    if (state.state === "running") {
      state.roundElapsed += delta;
      state.moveTimer += delta;
      if (state.moveTimer >= nextStepInterval()) {
        state.moveTimer = 0;
        moveSnake();
      }
    }

    updateEffects(delta);
    render();
    requestAnimationFrame(tick);
  }

  // ===== BUTTON EVENTS =====
  startButton.addEventListener("click", () => {
    unlockAudio();
    startGame();
  });

  helpButton.addEventListener("click", () => {
    openHelp();
  });

  closeHelpButton.addEventListener("click", () => {
    closeHelp();
  });

  confirmHelpButton.addEventListener("click", () => {
    closeHelp();
  });

  helpModal.addEventListener("click", (event) => {
    if (event.target === helpModal) {
      closeHelp();
    }
  });

  pauseButton.addEventListener("click", () => {
    unlockAudio();
    pauseGame();
  });

  restartButton.addEventListener("click", () => {
    unlockAudio();
    resetGame();
    startGame();
  });

  musicButton.addEventListener("click", () => {
    toggleMusic();
  });

  shellBgBtn.addEventListener("click", () => {
    cycleShellBackground();
  });

  boardBgBtn.addEventListener("click", () => {
    cycleBoardBackground();
  });

  // ===== INIT =====
  resetGame();
  loadBgPreferences(state);
  applyShellBackground();
  applyBoardBackground();
  requestAnimationFrame(tick);
})();
