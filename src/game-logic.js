import { CONFIG, COLORS, DIRECTIONS } from "./config.js";
import { spawnItem, getActiveCombo, readBestScore, state } from "./state.js";
import { burst, floatText } from "./effects.js";
import { playTone, playShieldHit } from "./audio.js";

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
  const interval = Math.max(CONFIG.MIN_INTERVAL, base - rushBoost);
  return performance.now() < state.slowUntil ? interval * CONFIG.SLOW_SPEED_FACTOR : interval;
}

function collectFood(item, type) {
  const multiplier = performance.now() < state.multiplierUntil ? 2 : 1;
  const basePoints =
    type === "fruit"
      ? CONFIG.SCORE_FRUIT
      : type === "spark"
        ? CONFIG.SCORE_SPARK
        : type === "prism"
          ? CONFIG.SCORE_PRISM
          : type === "shield"
            ? CONFIG.SCORE_SHIELD
            : CONFIG.SCORE_SLOW;
  const gained = Math.round(basePoints * Math.max(1, state.combo) * multiplier);

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
    type === "fruit"
      ? COLORS.fruit
      : type === "spark"
        ? COLORS.spark
        : type === "prism"
          ? COLORS.prism
          : type === "shield"
            ? COLORS.shield
            : COLORS.slow;
  const particleCount = type === "fruit" ? CONFIG.PARTICLE_FRUIT_COUNT : CONFIG.PARTICLE_SPECIAL_COUNT;
  burst(item, color, particleCount);
  floatText(item, "+" + gained, color);
  playTone(type);
}

function moveSnake(delta) {
  state.direction = state.nextDirection;
  if (state.inputBuffer !== null) {
    state.nextDirection = state.inputBuffer;
    state.inputBuffer = null;
  }

  const head = {
    x: state.snake[0].x + state.direction.x,
    y: state.snake[0].y + state.direction.y
  };

  // Collision detection with shield support
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
      // Shield absorbs ALL hits
      if (hitObstacle) {
        state.obstacles.splice(hitObstacleIndex, 1);
      } else if (hitSelf && hitSelfIndex > 1) {
        state.snake.splice(hitSelfIndex);
      }
      playShieldHit();
      return null;
    } else {
      return { gameOver: true };
    }
  }

  state.snake.unshift(head);

  // Update trail history
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
    const decayPerSecond = CONFIG.DIFFICULTIES[state.difficulty].comboDecay;
    const decayAmount = decayPerSecond * (delta / 1000);
    state.combo = Math.max(1, state.combo - decayAmount);
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

  const current = state.inputBuffer || state.direction;

  if (wanted.x + current.x === 0 && wanted.y + current.y === 0) {
    return;
  }

  if (wanted.x === current.x && wanted.y === current.y) {
    return;
  }

  if (state.inputBuffer === null) {
    state.inputBuffer = wanted;
    state.nextDirection = wanted;
  } else {
    state.inputBuffer = wanted;
  }
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
