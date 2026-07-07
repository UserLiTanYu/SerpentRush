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

export {
  CONFIG,
  ACHIEVEMENTS,
  COLORS,
  DIRECTIONS,
  SHELL_BACKGROUNDS,
  BOARD_BACKGROUNDS,
  BOARD_BG_NAMES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CELL_SIZE,
};
