import { CONFIG, COLORS } from "./config.js";
import { loadBgPreferences, saveBestScore, state } from "./state.js";
import { burst, updateEffects } from "./effects.js";
import { unlockAudio, startMusic, stopMusic } from "./audio.js";
import { render } from "./renderer.js";
import { moveSnake, nextStepInterval, getDifficultyTitle, applyDifficulty, setDirection } from "./game-logic.js";
import { checkAchievements, updateAchieveCount, renderAchievePanel } from "./achievements.js";
import {
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
} from "./ui.js";
import { setupTouchInput } from "./input.js";

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
