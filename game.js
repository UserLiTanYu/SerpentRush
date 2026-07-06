const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

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

const boardColumns = 40;
const boardRows = 24;
const cellSize = Math.min(canvas.width / boardColumns, canvas.height / boardRows);
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const colors = {
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

let snake;
let direction;
let nextDirection;
let food;
let specialFood;
let obstacles;
let score;
let best;
let combo;
let level;
let rush;
let multiplierTicks;
let moveTimer;
let lastTime;
let gameState;
let particles;
let floatingTexts;
let audioContext;
let musicEnabled;
let musicGain;
let musicTimer;
let musicNextTime;
let musicStep;
let helpPreviousState;
let roundElapsed;
let maxCombo;
let maxLevel;
let fruitCount;
let sparkCount;
let prismCount;

function readBestScore() {
  return Number(localStorage.getItem("serpentRushBest") || "0");
}

function saveBestScore(value) {
  localStorage.setItem("serpentRushBest", String(value));
}

function resetGame() {
  stopMusic();
  snake = [
    { x: 14, y: 12 },
    { x: 13, y: 12 },
    { x: 12, y: 12 }
  ];
  direction = directions.right;
  nextDirection = directions.right;
  obstacles = [];
  score = 0;
  combo = 1;
  level = 1;
  rush = 0;
  multiplierTicks = 0;
  moveTimer = 0;
  roundElapsed = 0;
  maxCombo = 1;
  maxLevel = 1;
  fruitCount = 0;
  sparkCount = 0;
  prismCount = 0;
  lastTime = performance.now();
  gameState = "ready";
  particles = [];
  floatingTexts = [];
  musicEnabled = musicEnabled ?? true;
  best = readBestScore();
  food = spawnItem("fruit");
  specialFood = null;
  updateHud();
  showOverlay("准备", "SerpentRush", "收集发光果实，叠加连击，在加速狂潮中坚持更久。", "开始游戏");
}

function startGame() {
  if (gameState === "running") {
    return;
  }
  if (gameState === "gameover") {
    resetGame();
  }
  gameState = "running";
  lastTime = performance.now();
  hideOverlay();
  updateStatus("进行中");
  startMusic();
}

function pauseGame() {
  if (gameState === "running") {
    gameState = "paused";
    stopMusic();
    showOverlay("暂停", "稍作休整", "本局游戏会停在当前位置，准备好就继续冲刺。", "继续游戏");
    updateStatus("已暂停");
  } else if (gameState === "paused") {
    startGame();
  }
}

function gameOver() {
  gameState = "gameover";
  stopMusic();
  best = Math.max(best, score);
  saveBestScore(best);
  burst(snake[0], colors.fruit, 28);
  showGameOverOverlay();
  updateStatus("撞到了");
  updateHud();
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
    ["最高连击", `x${formatCombo(maxCombo)}`],
    ["吃到果实", fruitCount],
    ["最高等级", maxLevel],
    ["存活时间", formatDuration(roundElapsed)],
    ["电光", sparkCount],
    ["棱晶", prismCount]
  ];

  overlayLabel.textContent = "游戏结束";
  overlayTitle.textContent = `${score} 分`;
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

function updateStatus(text) {
  statusPill.textContent = text;
}

function updateHud() {
  const comboText = formatCombo(getActiveCombo());
  scoreValue.textContent = score;
  bestValue.textContent = Math.max(best, score);
  comboValue.textContent = `x${comboText}`;
  levelValue.textContent = level;
  rushLabel.textContent = `${Math.round(rush)}%`;
  rushMeter.style.width = `${Math.min(100, rush)}%`;
  pauseButton.textContent = gameState === "paused" ? "继续" : "暂停";
  musicButton.textContent = musicEnabled ? "音乐 开" : "音乐 关";
}

function getActiveCombo() {
  return combo * (multiplierTicks > 0 ? 2 : 1);
}

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

function setDirection(name) {
  const wanted = directions[name];
  if (!wanted || gameState === "gameover") {
    return;
  }
  if (wanted.x + direction.x === 0 && wanted.y + direction.y === 0) {
    return;
  }
  nextDirection = wanted;
  if (gameState === "ready") {
    startGame();
  }
}

function isOccupied(point) {
  return snake.some((part) => part.x === point.x && part.y === point.y)
    || obstacles.some((block) => block.x === point.x && block.y === point.y)
    || (food && food.x === point.x && food.y === point.y)
    || (specialFood && specialFood.x === point.x && specialFood.y === point.y);
}

function spawnItem(type) {
  let point;
  do {
    point = {
      x: Math.floor(Math.random() * boardColumns),
      y: Math.floor(Math.random() * boardRows),
      type
    };
  } while (isOccupied(point));
  return point;
}

function spawnObstaclePack() {
  const targetCount = Math.min(24, 4 + level * 2);
  while (obstacles.length < targetCount) {
    const block = spawnItem("wall");
    const nearHead = Math.abs(block.x - snake[0].x) + Math.abs(block.y - snake[0].y) < 6;
    if (!nearHead) {
      obstacles.push(block);
    }
  }
}

function nextStepInterval() {
  const base = 150 - Math.min(72, (level - 1) * 9);
  const rushBoost = rush >= 100 ? 32 : 0;
  return Math.max(54, base - rushBoost);
}

function moveSnake() {
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (
    head.x < 0 || head.x >= boardColumns ||
    head.y < 0 || head.y >= boardRows ||
    snake.some((part, index) => index > 0 && part.x === head.x && part.y === head.y) ||
    obstacles.some((block) => block.x === head.x && block.y === head.y)
  ) {
    gameOver();
    return;
  }

  snake.unshift(head);

  let grew = false;
  if (head.x === food.x && head.y === food.y) {
    collectFood(food, "fruit");
    food = spawnItem("fruit");
    grew = true;
  }

  if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
    collectFood(specialFood, specialFood.type);
    specialFood = null;
    grew = true;
  }

  if (!grew) {
    snake.pop();
    combo = Math.max(1, combo - 0.015);
    rush = Math.max(0, rush - 0.5);
  }

  level = Math.max(1, Math.floor(score / 80) + 1);
  maxLevel = Math.max(maxLevel, level);
  if (level >= 2) {
    spawnObstaclePack();
  }

  if (!specialFood && Math.random() < 0.035 + level * 0.004) {
    specialFood = spawnItem(Math.random() < 0.56 ? "spark" : "prism");
  }

  if (multiplierTicks > 0) {
    multiplierTicks -= 1;
  }

  updateHud();
}

function collectFood(item, type) {
  const multiplier = multiplierTicks > 0 ? 2 : 1;
  const points = type === "fruit" ? 10 : type === "spark" ? 20 : 30;
  const gained = Math.round(points * Math.max(1, combo) * multiplier);

  score += gained;
  combo = Math.min(8, combo + (type === "fruit" ? 0.35 : 0.75));
  rush = Math.min(100, rush + (type === "fruit" ? 12 : 24));

  if (type === "spark") {
    rush = 100;
  }
  if (type === "prism") {
    multiplierTicks = 50;
  }

  if (type === "fruit") {
    fruitCount += 1;
  } else if (type === "spark") {
    sparkCount += 1;
  } else if (type === "prism") {
    prismCount += 1;
  }

  maxCombo = Math.max(maxCombo, getActiveCombo());

  const color = type === "fruit" ? colors.fruit : type === "spark" ? colors.spark : colors.prism;
  burst(item, color, type === "fruit" ? 14 : 24);
  floatText(item, `+${gained}`, color);
  playTone(type);
}

function burst(point, color, amount) {
  for (let i = 0; i < amount; i += 1) {
    particles.push({
      x: (point.x + 0.5) * cellSize,
      y: (point.y + 0.5) * cellSize,
      vx: (Math.random() - 0.5) * 220,
      vy: (Math.random() - 0.5) * 220,
      life: 420 + Math.random() * 240,
      maxLife: 660,
      color
    });
  }
}

function floatText(point, text, color) {
  floatingTexts.push({
    x: (point.x + 0.5) * cellSize,
    y: (point.y + 0.3) * cellSize,
    text,
    color,
    life: 720,
    maxLife: 720
  });
}

function playTone(type) {
  if (!audioContext) {
    return;
  }
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const frequency = type === "fruit" ? 360 : type === "spark" ? 580 : 720;
  osc.frequency.value = frequency;
  osc.type = "triangle";
  gain.gain.setValueAtTime(0.07, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();
  osc.stop(audioContext.currentTime + 0.13);
}

function playMusicNote(frequency, startTime, duration, type, volume) {
  if (!musicGain || frequency <= 0) {
    return;
  }

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(musicGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.04);
}

function scheduleMusic() {
  if (!audioContext || !musicGain || !musicEnabled) {
    return;
  }

  const tempo = 126;
  const stepDuration = 60 / tempo / 2;
  const lookAhead = audioContext.currentTime + 1.2;
  const bassNotes = [130.81, 0, 98, 0, 110, 0, 87.31, 0, 130.81, 0, 146.83, 0, 98, 0, 116.54, 0];
  const leadNotes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 0, 659.25, 783.99, 880, 1046.5, 880, 783.99, 659.25, 0];
  const sparkleNotes = [0, 0, 0, 1046.5, 0, 0, 987.77, 0, 0, 1174.66, 0, 0, 1046.5, 0, 0, 0];

  while (musicNextTime < lookAhead) {
    const index = musicStep % 16;
    playMusicNote(bassNotes[index], musicNextTime, stepDuration * 1.6, "triangle", 0.034);
    playMusicNote(leadNotes[index], musicNextTime + stepDuration * 0.08, stepDuration * 0.72, "square", 0.018);

    if (sparkleNotes[index]) {
      playMusicNote(sparkleNotes[index], musicNextTime + stepDuration * 0.44, stepDuration * 0.38, "sine", 0.014);
    }

    if (musicStep % 8 === 0) {
      playMusicNote(bassNotes[index] / 2, musicNextTime, stepDuration * 3.4, "sine", 0.016);
    }

    musicNextTime += stepDuration;
    musicStep += 1;
  }
}

function startMusic() {
  if (!audioContext || !musicEnabled || musicGain || gameState !== "running") {
    return;
  }

  musicGain = audioContext.createGain();
  musicGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  musicGain.gain.exponentialRampToValueAtTime(0.80, audioContext.currentTime + 0.35);
  musicGain.connect(audioContext.destination);
  musicNextTime = audioContext.currentTime + 0.05;
  musicStep = 0;
  scheduleMusic();
  musicTimer = window.setInterval(scheduleMusic, 260);
}

function stopMusic() {
  if (musicTimer) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }

  if (musicGain && audioContext) {
    const gainToStop = musicGain;
    gainToStop.gain.cancelScheduledValues(audioContext.currentTime);
    gainToStop.gain.setValueAtTime(Math.max(gainToStop.gain.value, 0.0001), audioContext.currentTime);
    gainToStop.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);
    window.setTimeout(() => gainToStop.disconnect(), 260);
  }

  musicGain = null;
}

function toggleMusic() {
  unlockAudio();
  musicEnabled = !musicEnabled;
  if (musicEnabled && gameState === "running") {
    startMusic();
  } else {
    stopMusic();
  }
  updateHud();
}

function openHelp() {
  helpPreviousState = gameState;
  if (gameState === "running") {
    gameState = "paused";
    stopMusic();
    updateStatus("看说明");
    updateHud();
  }
  helpModal.classList.remove("is-hidden");
  closeHelpButton.focus();
}

function closeHelp() {
  helpModal.classList.add("is-hidden");
  if (helpPreviousState === "running" && gameState === "paused") {
    gameState = "running";
    lastTime = performance.now();
    updateStatus("进行中");
    startMusic();
  } else if (gameState === "paused") {
    updateStatus("已暂停");
  }
  updateHud();
  helpButton.focus();
  helpPreviousState = null;
}

function updateEffects(delta) {
  particles = particles.filter((particle) => {
    particle.life -= delta;
    particle.x += particle.vx * delta / 1000;
    particle.y += particle.vy * delta / 1000;
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    return particle.life > 0;
  });

  floatingTexts = floatingTexts.filter((text) => {
    text.life -= delta;
    text.y -= delta * 0.035;
    return text.life > 0;
  });
}

function drawBoard() {
  ctx.fillStyle = colors.boardA;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < boardRows; y += 1) {
    for (let x = 0; x < boardColumns; x += 1) {
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = colors.boardB;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= boardColumns; i += 1) {
    const p = i * cellSize;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, canvas.height);
    ctx.stroke();
  }

  for (let i = 0; i <= boardRows; i += 1) {
    const p = i * cellSize;
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(canvas.width, p);
    ctx.stroke();
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
  const x = point.x * cellSize + inset;
  const y = point.y * cellSize + inset;
  const size = cellSize - inset * 2;
  roundedRect(x, y, size, size, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawFoodItem(item) {
  if (!item) {
    return;
  }
  const color = item.type === "spark" ? colors.spark : item.type === "prism" ? colors.prism : colors.fruit;
  const centerX = (item.x + 0.5) * cellSize;
  const centerY = (item.y + 0.5) * cellSize;
  const pulse = 1 + Math.sin(performance.now() / 120) * 0.07;

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = item.type === "fruit" ? 14 : 24;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, cellSize * 0.27 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.arc(centerX - 4, centerY - 5, cellSize * 0.07, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnake() {
  snake.forEach((part, index) => {
    const isHead = index === 0;
    const shade = index % 2 === 0 ? colors.snake : colors.snakeDark;
    ctx.save();
    ctx.shadowColor = isHead ? colors.snake : "transparent";
    ctx.shadowBlur = isHead ? 18 : 0;
    drawCell(part, isHead ? colors.head : shade, isHead ? 3 : 4, isHead ? 9 : 7);
    ctx.restore();

    if (isHead) {
      drawEyes(part);
    }
  });
}

function drawEyes(head) {
  const centerX = (head.x + 0.5) * cellSize;
  const centerY = (head.y + 0.5) * cellSize;
  const offsetX = direction.x * 5;
  const offsetY = direction.y * 5;
  const sideX = direction.y * 5;
  const sideY = -direction.x * 5;

  ctx.fillStyle = "#101216";
  ctx.beginPath();
  ctx.arc(centerX + offsetX + sideX, centerY + offsetY + sideY, 3.2, 0, Math.PI * 2);
  ctx.arc(centerX + offsetX - sideX, centerY + offsetY - sideY, 3.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawObstacles() {
  obstacles.forEach((block) => {
    drawCell(block, colors.wall, 5, 6);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function drawEffects() {
  particles.forEach((particle) => {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 3.2 * alpha, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  floatingTexts.forEach((item) => {
    const alpha = Math.max(0, item.life / item.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = item.color;
    ctx.font = "800 22px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.text, item.x, item.y);
  });
  ctx.globalAlpha = 1;
}

function drawRushFrame() {
  if (rush < 100) {
    return;
  }
  const alpha = 0.25 + Math.sin(performance.now() / 90) * 0.12;
  ctx.strokeStyle = `rgba(255, 209, 102, ${alpha})`;
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
}

function render() {
  drawBoard();
  drawFoodItem(food);
  drawFoodItem(specialFood);
  drawObstacles();
  drawSnake();
  drawEffects();
  drawRushFrame();
}

function tick(time) {
  const delta = Math.min(60, time - lastTime);
  lastTime = time;

  if (gameState === "running") {
    roundElapsed += delta;
    moveTimer += delta;
    if (moveTimer >= nextStepInterval()) {
      moveTimer = 0;
      moveSnake();
    }
  }

  updateEffects(delta);
  render();
  requestAnimationFrame(tick);
}

function unlockAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

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

resetGame();
requestAnimationFrame(tick);
