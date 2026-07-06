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
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");

const boardSize = 24;
const cellSize = canvas.width / boardSize;
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

function readBestScore() {
  return Number(localStorage.getItem("serpentRushBest") || "0");
}

function saveBestScore(value) {
  localStorage.setItem("serpentRushBest", String(value));
}

function resetGame() {
  snake = [
    { x: 8, y: 12 },
    { x: 7, y: 12 },
    { x: 6, y: 12 }
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
  lastTime = performance.now();
  gameState = "ready";
  particles = [];
  floatingTexts = [];
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
}

function pauseGame() {
  if (gameState === "running") {
    gameState = "paused";
    showOverlay("暂停", "稍作休整", "本局游戏会停在当前位置，准备好就继续冲刺。", "继续游戏");
    updateStatus("已暂停");
  } else if (gameState === "paused") {
    startGame();
  }
}

function gameOver() {
  gameState = "gameover";
  best = Math.max(best, score);
  saveBestScore(best);
  burst(snake[0], colors.fruit, 28);
  showOverlay("游戏结束", `${score} 分`, "再来一局，冲刺节奏马上就能找回来。", "重新开始");
  updateStatus("撞到了");
  updateHud();
}

function showOverlay(label, title, copy, buttonText) {
  overlayLabel.textContent = label;
  overlayTitle.textContent = title;
  overlayCopy.textContent = copy;
  startButton.textContent = buttonText;
  overlay.classList.remove("is-hidden");
}

function hideOverlay() {
  overlay.classList.add("is-hidden");
}

function updateStatus(text) {
  statusPill.textContent = text;
}

function updateHud() {
  const activeCombo = combo * (multiplierTicks > 0 ? 2 : 1);
  const comboText = activeCombo.toFixed(1).replace(/\.0$/, "");
  scoreValue.textContent = score;
  bestValue.textContent = Math.max(best, score);
  comboValue.textContent = `x${comboText}`;
  levelValue.textContent = level;
  rushLabel.textContent = `${Math.round(rush)}%`;
  rushMeter.style.width = `${Math.min(100, rush)}%`;
  pauseButton.textContent = gameState === "paused" ? "继续" : "暂停";
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
      x: Math.floor(Math.random() * boardSize),
      y: Math.floor(Math.random() * boardSize),
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
    head.x < 0 || head.x >= boardSize ||
    head.y < 0 || head.y >= boardSize ||
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

  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize; x += 1) {
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = colors.boardB;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= boardSize; i += 1) {
    const p = i * cellSize;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, canvas.height);
    ctx.stroke();
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

pauseButton.addEventListener("click", () => {
  unlockAudio();
  pauseGame();
});

restartButton.addEventListener("click", () => {
  unlockAudio();
  resetGame();
  startGame();
});

resetGame();
requestAnimationFrame(tick);
