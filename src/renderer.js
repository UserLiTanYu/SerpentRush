import { CONFIG, COLORS, BOARD_BACKGROUNDS, CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE } from "./config.js";
import { getActiveCombo, state } from "./state.js";

const canvas = document.querySelector("#gameCanvas");
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
    item.type === "spark"
      ? COLORS.spark
      : item.type === "prism"
        ? COLORS.prism
        : item.type === "shield"
          ? COLORS.shield
          : item.type === "slow"
            ? COLORS.slow
            : COLORS.fruit;
  const centerX = (item.x + 0.5) * CELL_SIZE;
  const centerY = (item.y + 0.5) * CELL_SIZE;
  const pulse = 1 + Math.sin(performance.now() / 120) * 0.07;
  const now = performance.now();

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = item.type === "fruit" ? 14 : 24;

  if (item.type === "shield") {
    // Gold hexagon with glow pulse
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
    // Inner highlight
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 4, CELL_SIZE * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.type === "slow") {
    // Blue circle with two horizontal bars (slow indicator)
    const r = CELL_SIZE * 0.27 * pulse;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.fill();
    // Two horizontal bars inside
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    const barW = r * 0.7;
    const barH = 2.5;
    ctx.fillRect(centerX - barW / 2, centerY - 4, barW, barH);
    ctx.fillRect(centerX - barW / 2, centerY + 2, barW, barH);
    // Highlight
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 5, CELL_SIZE * 0.06, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Default circle for fruit/spark/prism
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
  const indices = [1, 3, 5]; // Skip every other for spacing
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
  const intensity = (combo - 3) / 13; // x4 → ~0.08, x8 → ~0.38
  const alpha = Math.min(0.45, intensity * (0.7 + 0.3 * Math.sin(performance.now() / 300)));
  const edgeSize = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.08;

  // Gradient from edges inward — low combo green, high combo gold
  const t = Math.min(1, (combo - 4) / 8); // 0 at x4, 1 at x12
  const r = Math.round(92 + t * 167); // 92 → 255
  const g = Math.round(242 - t * 33); // 242 → 209
  const b = Math.round(139 - t * 47); // 139 → 102
  const color = "rgba(" + r + "," + g + "," + b + ",";

  // Top edge
  const topGrad = ctx.createLinearGradient(0, 0, 0, edgeSize);
  topGrad.addColorStop(0, color + alpha + ")");
  topGrad.addColorStop(1, "transparent");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, edgeSize);

  // Bottom edge
  const botGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT, 0, CANVAS_HEIGHT - edgeSize);
  botGrad.addColorStop(0, color + alpha + ")");
  botGrad.addColorStop(1, "transparent");
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, CANVAS_HEIGHT - edgeSize, CANVAS_WIDTH, edgeSize);

  // Left edge
  const leftGrad = ctx.createLinearGradient(0, 0, edgeSize, 0);
  leftGrad.addColorStop(0, color + alpha + ")");
  leftGrad.addColorStop(1, "transparent");
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 0, edgeSize, CANVAS_HEIGHT);

  // Right edge
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
    timers.push({
      label: "×2 得分",
      remain: state.multiplierUntil - now,
      total: CONFIG.PRISM_DURATION_MS,
      color: COLORS.prism
    });
  }
  if (now < state.shieldUntil) {
    timers.push({
      label: "护盾",
      remain: state.shieldUntil - now,
      total: CONFIG.SHIELD_DURATION_MS,
      color: COLORS.shield
    });
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

    // Background bar
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    roundedRect(startX, startY + 18, barWidth, barHeight, 3);
    ctx.fill();

    // Filled bar
    ctx.fillStyle = t.color;
    roundedRect(startX, startY + 18, barWidth * frac, barHeight, 3);
    ctx.fill();

    // Label + time text
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

export { invalidateBgCache, render };
