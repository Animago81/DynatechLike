// Bootstrap: load state, run the simulation loop, autosave, register the PWA.

import { loadGame, saveGame, getState } from "./state.js";
import { simulate, estimateIncomePerSec } from "./engine.js";
import { setLang, applyStaticI18n } from "./i18n.js";
import { render, tickRender, wireNav, toast } from "./ui.js";
import { fmt } from "./format.js";
import { t } from "./i18n.js";

function boot() {
  const s = loadGame();
  setLang(s.lang);
  document.documentElement.lang = s.lang;
  applyStaticI18n();

  // Offline progress since last save.
  const now = Date.now();
  const offlineSec = Math.max(0, (now - (s.lastTick || now)) / 1000);
  if (offlineSec > 5) {
    const before = s.credits + s.stats.totalEarned;
    simulate(offlineSec);
    // Note: production fills storage; income is realized on sale/ship delivery.
    const earned = s.credits + s.stats.totalEarned - before;
    if (earned > 0) {
      setTimeout(() => toast(`${t("toast.offline")} +¢${fmt(earned)}`, "good"), 400);
    }
  }
  s.lastTick = now;

  wireNav();
  render();

  // Main simulation loop.
  let last = performance.now();
  function loop(ts) {
    const dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0 && dt < 5) simulate(dt); // ignore tab-switch jumps; offline handled separately
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // UI refresh (decoupled from sim for smoothness/perf).
  setInterval(tickRender, 250);

  // Autosave + handle backgrounding.
  setInterval(saveGame, 5000);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveGame();
  });
  window.addEventListener("pagehide", saveGame);
}

// PWA service worker.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

boot();
