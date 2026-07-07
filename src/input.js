import { unlockAudio } from "./audio.js";
import { setDirection } from "./game-logic.js";

function setupTouchInput(onStart) {
  document.querySelectorAll("[data-dir]").forEach(function (button) {
    button.addEventListener("click", function () {
      unlockAudio();
      setDirection(button.dataset.dir);
      if (onStart) onStart();
    });
  });
}

export { setupTouchInput };
