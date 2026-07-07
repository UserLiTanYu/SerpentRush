import { CONFIG, SHELL_BACKGROUNDS, BOARD_BACKGROUNDS, BOARD_BG_NAMES } from "./config.js";
import { getActiveCombo, saveShellBg, saveBoardBg, state } from "./state.js";
import { unlockAudio, startMusic, stopMusic } from "./audio.js";
import { invalidateBgCache } from "./renderer.js";
import { renderAchievePanel } from "./achievements.js";

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

export {
  formatCombo,
  formatDuration,
  updateHud,
  updateStatus,
  toggleMusic,
  showOverlay,
  showGameOverOverlay,
  hideOverlay,
  openHelp,
  closeHelp,
  openAchieve,
  closeAchieve,
  applyShellBackground,
  applyBoardBackground,
  cycleShellBackground,
  cycleBoardBackground,
  updateDifficultyUI
};
