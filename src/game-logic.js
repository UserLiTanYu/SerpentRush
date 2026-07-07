import { CONFIG, COLORS, DIRECTIONS } from "./config.js";
import { spawnItem, getActiveCombo, readBestScore, state } from "./state.js";
import { burst, floatText } from "./effects.js";
import { playTone } from "./audio.js";

function spawnObstaclePack() {
  const diff = CONFIG.DIFFICULTIES[state.difficulty];
  const targetCount = Math.min(
    CONFIG.OBSTACLE_MAX,
    CONFIG.OBSTACLE_BASE + state.level * CONFIG.OBSTACLE_PER_LEVEL + diff.obstacleOffset
  );
  while (state.obstacles.length < targetCount) {
    const block = spawnItem(state, "wall");
    const nearHead =
      Math.abs(block.x - state.snake[0].x) + Math.abs(block.y - state.snake[0].y) < CONFIG.OBSTACLE_SAFE_DISTANCE;
    if (!nearHead) {
      state.obstacles.push(block);
    }
  }
}

function nextStepInterval() {
  const diff = CONFIG.DIFFICULTIES[state.difficulty];
  const base = diff.baseInterval - Math.min(CONFIG.SPEED_REDUCTION_CAP, (state.level - 1) * diff.speedPerLevel);
  const rushBoost = state.rush >= 100 ? CONFIG.RUSH_SPEED_BOOST : 0;
  return Math.max(CONFIG.MIN_INTERVAL, base - rushBoost);
}

function collectFood(item, type) {
  const multiplier = state.multiplierTicks > 0 ? 2 : 1;
  const points = type === "fruit" ? CONFIG.SCORE_FRUIT : type === "spark" ? CONFIG.SCORE_SPARK : CONFIG.SCORE_PRISM;
  const gained = Math.round(points * Math.max(1, state.combo) * multiplier);

  state.score += gained;
  state.combo = Math.min(
    CONFIG.COMBO_MAX,
    state.combo + (type === "fruit" ? CONFIG.COMBO_FRUIT_GAIN : CONFIG.COMBO_SPARK_GAIN)
  );
  state.rush = Math.min(100, state.rush + (type === "fruit" ? CONFIG.RUSH_FRUIT_GAIN : CONFIG.RUSH_SPECIAL_GAIN));

  if (type === "spark") {
    state.rush = 100;
    state.everRushed = true;
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
  floatText(item, "+" + gained, color);
  playTone(type);
}

function moveSnake() {
  state.direction = state.nextDirection;

  const head = {
    x: state.snake[0].x + state.direction.x,
    y: state.snake[0].y + state.direction.y
  };

  if (
    head.x < 0 ||
    head.x >= CONFIG.BOARD_COLUMNS ||
    head.y < 0 ||
    head.y >= CONFIG.BOARD_ROWS ||
    state.snake.some(function (part, index) {
      return index > 0 && part.x === head.x && part.y === head.y;
    }) ||
    state.obstacles.some(function (block) {
      return block.x === head.x && block.y === head.y;
    })
  ) {
    return { gameOver: true };
  }

  state.snake.unshift(head);

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

  if (
    !state.specialFood &&
    Math.random() <
      (CONFIG.SPECIAL_SPAWN_BASE + state.level * CONFIG.SPECIAL_SPAWN_PER_LEVEL) *
        CONFIG.DIFFICULTIES[state.difficulty].specialSpawnMultiplier
  ) {
    state.specialFood = spawnItem(state, Math.random() < CONFIG.SPECIAL_SPARK_CHANCE ? "spark" : "prism");
  }

  if (state.multiplierTicks > 0) {
    state.multiplierTicks -= 1;
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

export {
  spawnObstaclePack,
  nextStepInterval,
  collectFood,
  moveSnake,
  getDifficultyTitle,
  applyDifficulty,
  setDirection
};
