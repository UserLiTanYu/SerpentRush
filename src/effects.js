import { CELL_SIZE } from "./config.js";
import { state } from "./state.js";

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

export { burst, floatText, updateEffects };
