import { ACHIEVEMENTS } from "./config.js";
import { getActiveCombo, saveAchievements, state } from "./state.js";

function showAchievementToast(ach) {
  var container = document.querySelector(".achieve-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "achieve-toast-container";
    document.body.appendChild(container);
  }

  if (container.children.length >= 2) {
    container.firstChild.remove();
  }

  var toast = document.createElement("div");
  toast.className = "achieve-toast";
  toast.innerHTML = '<div class="achieve-toast-icon" style="background:' + ach.color + '22;color:' + ach.color + '">' + ach.icon + '</div>'
    + '<div class="achieve-toast-body"><strong>' + ach.name + '</strong><span>' + ach.desc + '</span></div>';

  container.appendChild(toast);

  setTimeout(function () {
    if (toast.parentNode) toast.remove();
  }, 3200);
}

function updateAchieveCount() {
  var el = document.querySelector("#achieveCount");
  if (el) el.textContent = Object.keys(state.achievements).length + "/12";
}

function checkAchievements() {
  ACHIEVEMENTS.forEach(function (ach) {
    if (state.achievements[ach.id]) return;

    var unlocked = false;
    switch (ach.id) {
      case "first_score":   unlocked = state.score >= 50; break;
      case "first_combo":   unlocked = getActiveCombo(state) >= 3; break;
      case "first_rush":    unlocked = state.everRushed; break;
      case "combo_master":  unlocked = getActiveCombo(state) >= 6; break;
      case "prism_hunter":  unlocked = state.prismCount >= 5; break;
      case "survivor_3min": unlocked = state.roundElapsed >= 180000; break;
      case "fruit_feast":   unlocked = state.fruitCount >= 50; break;
      case "score_200":     unlocked = state.score >= 200; break;
      case "score_500":     unlocked = state.score >= 500; break;
      case "level_10":      unlocked = state.level >= 10; break;
      case "spark_addict":  unlocked = state.sparkCount >= 8; break;
      case "perfectionist": unlocked = state.earlySurvived && state.score >= 80; break;
    }

    if (unlocked) {
      state.achievements[ach.id] = true;
      state.achievementsNew.push(ach.id);
      saveAchievements(state.achievements);
      showAchievementToast(ach);
    }
  });

  updateAchieveCount();
}

function renderAchievePanel(filter) {
  var achieveList = document.querySelector("#achieveList");
  if (!achieveList) return;
  filter = filter || "全部";

  var achieveFilters = document.querySelectorAll(".achieve-filter-btn");
  var activeFilterBtn = document.querySelector(".achieve-filter-btn.is-active");
  if (activeFilterBtn) activeFilterBtn.classList.remove("is-active");

  achieveFilters.forEach(function (btn) {
    if (btn.dataset.filter === filter) btn.classList.add("is-active");
  });

  achieveList.innerHTML = "";

  ACHIEVEMENTS.forEach(function (ach) {
    if (filter !== "全部" && ach.category !== filter) return;

    var unlocked = !!state.achievements[ach.id];
    var item = document.createElement("div");
    item.className = "achieve-item" + (unlocked ? " is-unlocked" : "");

    item.innerHTML = '<span class="achieve-item-icon" style="background:' + ach.color + '22;color:' + ach.color + '">'
      + ach.icon + '</span>'
      + '<span class="achieve-item-body">'
      + '<strong>' + ach.name + '</strong>'
      + '<span>' + ach.desc + '</span>'
      + '</span>'
      + '<span class="achieve-item-status">' + (unlocked ? "✓" : "🔒") + '</span>';

    achieveList.appendChild(item);
  });

  updateAchieveCount();
}

export { checkAchievements, showAchievementToast, updateAchieveCount, renderAchievePanel };
