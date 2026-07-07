import { CONFIG } from "./config.js";
import { state } from "./state.js";

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
    window.setTimeout(function () { gainToStop.disconnect(); }, 260);
  }

  state.musicGain = null;
}

export { unlockAudio, playTone, scheduleMusic, startMusic, stopMusic };
