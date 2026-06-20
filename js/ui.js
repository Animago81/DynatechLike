// Rendering and user interaction. Re-renders the active tab on a timer.

import {
  RESOURCES, RESOURCE_IDS, BUILDING_IDS, BUILDINGS, RECIPES, PLANETS,
  PLANET_BY_ID, SHIPS, SHIP_IDS, buildingCost, planetCapacity, planetStockTotal,
  sellPrice, equilibriumFactor,
} from "./data.js";
import { getState, saveGame, resetGame, exportSave, importSave } from "./state.js";
import {
  planetNetRates, estimateIncomePerSec, sellGood, build, canBuild,
  unlockPlanet, buyShip, setRoute, shipCanCarry,
} from "./engine.js";
import { t, setLang, getLang, applyStaticI18n } from "./i18n.js";
import { fmt, fmtRate, fmtTime, clamp } from "./format.js";

const $view = document.getElementById("view");
const $credits = document.getElementById("creditsValue");
const $rate = document.getElementById("creditsRate");
const $strip = document.getElementById("planetStrip");
const $nav = document.getElementById("nav");

// ---------- Helpers ----------
function el(html) {
  const t2 = document.createElement("template");
  t2.innerHTML = html.trim();
  return t2.content.firstElementChild;
}
function resName(g) { return t("res." + g); }
function resIcon(g) { return RESOURCES[g].icon; }

export function toast(msg, kind = "") {
  const box = document.getElementById("toasts");
  const node = el(`<div class="toast ${kind}">${msg}</div>`);
  box.appendChild(node);
  setTimeout(() => node.remove(), 2000);
}

// ---------- Header / planet strip ----------
export function renderHeader() {
  const s = getState();
  $credits.textContent = fmt(s.credits);
  const inc = estimateIncomePerSec();
  $rate.textContent = inc > 0 ? fmtRate(inc) : "";
  $rate.className = "cr-rate " + (inc > 0 ? "pos" : "");
}

export function renderPlanetStrip() {
  const s = getState();
  $strip.innerHTML = "";
  for (const p of PLANETS) {
    const ps = s.planets[p.id];
    if (!ps.unlocked) continue;
    const chip = el(`
      <button class="planet-chip ${p.id === s.currentPlanet ? "active" : ""}">
        <span class="dot" style="background:${p.color}"></span>
        <span>${t("planet." + p.id)}</span>
      </button>`);
    chip.addEventListener("click", () => { s.currentPlanet = p.id; render(); });
    $strip.appendChild(chip);
  }
}

// ---------- Tabs ----------
export function render() {
  const s = getState();
  renderHeader();
  renderPlanetStrip();
  const tab = s.activeTab;
  if (tab === "production") renderProduction();
  else if (tab === "market") renderMarket();
  else if (tab === "fleet") renderFleet();
  else if (tab === "planets") renderPlanets();
  else if (tab === "settings") renderSettings();

  // sync nav active state
  $nav.querySelectorAll(".nav-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === tab));
}

// Lightweight refresh: only update dynamic numbers when on a live tab.
export function tickRender() {
  const s = getState();
  renderHeader();
  if (s.activeTab === "production") renderProduction();
  else if (s.activeTab === "market") renderMarket();
  else if (s.activeTab === "fleet") renderFleet();
}

// ---------- Production tab ----------
function storagePanel(planetId, ps) {
  const cap = planetCapacity(ps);
  const used = planetStockTotal(ps);
  const pct = clamp((used / cap) * 100, 0, 100);
  const cells = RESOURCE_IDS.map((g) => `
    <div class="stock-cell">
      <div class="ico">${resIcon(g)}</div>
      <div class="v">${fmt(ps.stock[g])}</div>
      <div class="n">${resName(g)}</div>
    </div>`).join("");
  return `
    <div class="card">
      <div class="row">
        <div class="section-title" style="margin:0">${t("prod.storage")}</div>
        <div class="muted">${fmt(used)} / ${fmt(cap)}</div>
      </div>
      <div class="capwrap"><div class="bar ${pct > 95 ? "full" : ""}"><span style="width:${pct}%"></span></div></div>
      <div class="stock-grid" style="margin-top:10px">${cells}</div>
    </div>`;
}

function buildingCard(planetId, ps, def, bId) {
  const b = BUILDINGS[bId];
  const lvl = ps.buildings[bId];
  const cost = buildingCost(bId, lvl);
  const noDeposit = b.produces && (def.deposits[b.produces] || 0) <= 0;
  const rates = b.produces || b.recipe ? singleBuildingRate(def, bId, lvl + 1) : null;

  let flow = "";
  if (b.produces) {
    flow = `<span class="chip out">+${fmt(rates.out[b.produces])}/s ${resIcon(b.produces)}</span>`;
  } else if (b.recipe) {
    const rec = RECIPES[b.recipe];
    const ins = Object.entries(rec.in).map(([g, q]) =>
      `<span class="chip in">${resIcon(g)} ${q}</span>`).join("");
    const outs = Object.entries(rec.out).map(([g]) =>
      `<span class="chip out">${resIcon(g)} ${resName(g)}</span>`).join("");
    flow = `${ins}<span class="arrow">→</span>${outs}`;
  } else if (b.capacity) {
    flow = `<span class="chip out">+${fmt(b.capacity)} ${t("common.capacity")}</span>`;
  }

  const card = el(`
    <div class="card">
      <div class="item-head">
        <div class="item-ico">${b.icon}</div>
        <div class="col" style="flex:1">
          <div class="row">
            <span class="item-name">${t("bld." + bId)}</span>
            <span class="lvl">${lvl > 0 ? t("common.level") + " " + lvl : ""}</span>
          </div>
          <div class="flow">${flow}</div>
        </div>
      </div>
      ${noDeposit
        ? `<div class="locked-note" style="margin-top:8px">${t("prod.noDeposit")}</div>`
        : `<button class="btn primary" style="width:100%;margin-top:10px" ${getState().credits < cost ? "disabled" : ""}>
             ${lvl > 0 ? t("common.upgrade") : t("common.build")} · ¢${fmt(cost)}
           </button>`}
    </div>`);

  if (!noDeposit) {
    card.querySelector("button").addEventListener("click", () => {
      if (build(planetId, bId)) {
        toast((ps.buildings[bId] > 1 ? t("toast.upgraded") : t("toast.built")), "good");
        saveGame();
        render();
      } else {
        toast(t("toast.cantAfford"), "bad");
      }
    });
  }
  return card;
}

// Output rate of a single building at a given level (for the card preview).
function singleBuildingRate(def, bId, level) {
  const b = BUILDINGS[bId];
  const out = {};
  if (b.produces) out[b.produces] = b.rate * level * (def.deposits[b.produces] || 0);
  return { out };
}

function renderProduction() {
  const s = getState();
  const planetId = s.currentPlanet;
  const ps = s.planets[planetId];
  const def = PLANET_BY_ID[planetId];

  $view.innerHTML = "";
  $view.appendChild(el(storagePanel(planetId, ps)));
  $view.appendChild(el(`<div class="section-title">${t("prod.title")}</div>`));
  for (const bId of BUILDING_IDS) {
    $view.appendChild(buildingCard(planetId, ps, def, bId));
  }
}

// ---------- Market tab ----------
function renderMarket() {
  const s = getState();
  const planetId = s.currentPlanet;
  const ps = s.planets[planetId];
  const def = PLANET_BY_ID[planetId];

  $view.innerHTML = "";
  $view.appendChild(el(`<div class="section-title">${t("market.title")} · ${t("planet." + planetId)}</div>`));
  $view.appendChild(el(`<div class="card intro">${t("market.hint")}</div>`));

  for (const g of RESOURCE_IDS) {
    const price = sellPrice(g, ps.price[g]);
    const eq = sellPrice(g, equilibriumFactor(def, g));
    const trend = price > eq * 1.02 ? "trend-up" : price < eq * 0.98 ? "trend-down" : "";
    const stock = ps.stock[g];
    const card = el(`
      <div class="card">
        <div class="item-head">
          <div class="item-ico">${resIcon(g)}</div>
          <div class="col" style="flex:1">
            <div class="row">
              <span class="item-name">${resName(g)}</span>
              <span class="price ${trend}">¢${price.toFixed(2)}</span>
            </div>
            <div class="muted">${t("market.stock")}: ${fmt(stock)}</div>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn sell10" ${stock < 10 ? "disabled" : ""}>${t("common.sell")} 10</button>
          <button class="btn blue sellall" ${stock <= 0 ? "disabled" : ""}>${t("common.sellAll")}</button>
        </div>
      </div>`);

    card.querySelector(".sell10").addEventListener("click", () => doSell(planetId, g, 10));
    card.querySelector(".sellall").addEventListener("click", () => doSell(planetId, g, ps.stock[g]));
    $view.appendChild(card);
  }
}

function doSell(planetId, good, amount) {
  const earned = sellGood(planetId, good, amount);
  if (earned > 0) {
    toast(`${t("toast.sold")}: +¢${fmt(earned)}`, "good");
    saveGame();
    render();
  } else {
    toast(t("toast.nothingToSell"), "bad");
  }
}

// ---------- Fleet tab ----------
function unlockedPlanets() {
  const s = getState();
  return PLANETS.filter((p) => s.planets[p.id].unlocked);
}

function shipCard(ship) {
  const s = getState();
  const def = SHIPS[ship.type];
  const planets = unlockedPlanets();

  const phaseLabel = {
    idle: t("common.idle"), loading: t("fleet.loading"), idleWait: t("fleet.loading"),
    transit: t("fleet.transit"), selling: t("fleet.selling"), returning: t("fleet.returning"),
  }[ship.phase] || t("common.idle");

  const routeText = ship.route
    ? `${t("planet." + ship.route.from)} → ${t("planet." + ship.route.to)} · ${resIcon(ship.route.good)} ${resName(ship.route.good)}`
    : t("fleet.noRoute");

  const cargoText = ship.cargoAmt > 0 ? ` · ${fmt(ship.cargoAmt)} ${resIcon(ship.cargoGood)}` : "";

  const goodOpts = RESOURCE_IDS
    .filter((g) => shipCanCarry(ship.type, g))
    .map((g) => `<option value="${g}" ${ship.route && ship.route.good === g ? "selected" : ""}>${resName(g)}</option>`).join("");
  const fromOpts = planets.map((p) =>
    `<option value="${p.id}" ${ship.route && ship.route.from === p.id ? "selected" : ""}>${t("planet." + p.id)}</option>`).join("");
  const toOpts = planets.map((p) =>
    `<option value="${p.id}" ${ship.route && ship.route.to === p.id ? "selected" : ""}>${t("planet." + p.id)}</option>`).join("");

  const card = el(`
    <div class="card">
      <div class="item-head">
        <div class="item-ico">${def.icon}</div>
        <div class="col" style="flex:1">
          <div class="row">
            <span class="item-name">${t("ship." + ship.type)}</span>
            <span class="tag">${t("fleet.capacity")} ${def.capacity}</span>
          </div>
          <div class="ship-status muted">${phaseLabel}${cargoText} · ${routeText}</div>
        </div>
      </div>
      <div class="progress"><span style="width:${ship.route ? clamp(ship.progress * 100, 0, 100) : 0}%"></span></div>
      <div class="fields">
        <div class="field"><label>${t("fleet.good")}</label><select class="g">${goodOpts}</select></div>
        <div class="field"><label>${t("fleet.from")}</label><select class="f">${fromOpts}</select></div>
        <div class="field"><label>${t("fleet.to")}</label><select class="tt">${toOpts}</select></div>
      </div>
      <button class="btn blue assign" style="width:100%;margin-top:8px">${t("fleet.assign")}</button>
    </div>`);

  card.querySelector(".assign").addEventListener("click", () => {
    const g = card.querySelector(".g").value;
    const f = card.querySelector(".f").value;
    const to = card.querySelector(".tt").value;
    if (setRoute(ship.id, g, f, to)) {
      toast(t("toast.routeSet"), "good");
      saveGame();
      render();
    } else {
      toast(t("fleet.from") + " ≠ " + t("fleet.to"), "bad");
    }
  });
  return card;
}

function renderFleet() {
  const s = getState();
  $view.innerHTML = "";
  $view.appendChild(el(`<div class="section-title">${t("fleet.title")}</div>`));

  // Buy buttons
  const buy = el(`<div class="card"></div>`);
  for (const type of SHIP_IDS) {
    const def = SHIPS[type];
    const cargo = def.cargo === "any"
      ? "★ " + RESOURCE_IDS.map(resIcon).join("")
      : def.cargo.map(resName).join(", ");
    const row = el(`
      <div class="row" style="margin:6px 0">
        <div class="col">
          <span class="item-name">${def.icon} ${t("ship." + type)}</span>
          <span class="muted">${t("fleet.capacity")} ${def.capacity} · ${t("fleet.speed")} ${def.speed} · ${cargo}</span>
        </div>
        <button class="btn primary" ${s.credits < def.cost ? "disabled" : ""}>¢${fmt(def.cost)}</button>
      </div>`);
    row.querySelector("button").addEventListener("click", () => {
      if (buyShip(type)) { toast(t("toast.shipBought"), "good"); saveGame(); render(); }
      else toast(t("toast.cantAfford"), "bad");
    });
    buy.appendChild(row);
  }
  $view.appendChild(buy);

  if (s.ships.length === 0) {
    $view.appendChild(el(`<div class="empty">${t("fleet.noShips")}</div>`));
    return;
  }
  for (const ship of s.ships) $view.appendChild(shipCard(ship));
}

// ---------- Planets tab ----------
function renderPlanets() {
  const s = getState();
  $view.innerHTML = "";
  $view.appendChild(el(`<div class="section-title">${t("planets.title")}</div>`));

  for (const p of PLANETS) {
    const ps = s.planets[p.id];
    const deps = RESOURCE_IDS.filter((g) => RESOURCES[g].kind === "raw" && (p.deposits[g] || 0) > 0)
      .map((g) => `${resIcon(g)} ${(p.deposits[g]).toFixed(1)}×`).join("  ") || t("common.none");

    const card = el(`
      <div class="card">
        <div class="item-head">
          <div class="item-ico" style="background:${p.color}22;border-color:${p.color}">🪐</div>
          <div class="col" style="flex:1">
            <div class="row">
              <span class="item-name">${t("planet." + p.id)}</span>
              ${p.id === s.currentPlanet ? `<span class="lvl">${t("planets.current")}</span>` : ""}
            </div>
            <span class="muted">${t("common.deposits")}: ${deps}</span>
            <span class="muted">${t("common.population")}: ${(p.population * 100).toFixed(0)}% · ${t("common.distance")}: ${p.distance}</span>
          </div>
        </div>
        <div class="action" style="margin-top:10px"></div>
      </div>`);

    const action = card.querySelector(".action");
    if (!ps.unlocked) {
      const btn = el(`<button class="btn primary" style="width:100%" ${s.credits < p.unlockCost ? "disabled" : ""}>
        ${t("common.unlock")} · ¢${fmt(p.unlockCost)}</button>`);
      btn.addEventListener("click", () => {
        if (unlockPlanet(p.id)) {
          toast(t("toast.planetUnlocked"), "good");
          s.currentPlanet = p.id;
          saveGame();
          render();
        } else toast(t("toast.cantAfford"), "bad");
      });
      action.appendChild(btn);
    } else if (p.id !== s.currentPlanet) {
      const btn = el(`<button class="btn blue" style="width:100%">${t("planets.switch")}</button>`);
      btn.addEventListener("click", () => { s.currentPlanet = p.id; render(); });
      action.appendChild(btn);
    }
    $view.appendChild(card);
  }
}

// ---------- Settings tab ----------
function renderSettings() {
  const s = getState();
  const playSec = (Date.now() - (s.stats.startedAt || Date.now())) / 1000;
  $view.innerHTML = "";

  // Language
  const lang = el(`
    <div class="card">
      <div class="section-title" style="margin-top:0">${t("settings.language")}</div>
      <div class="btn-row">
        <button class="btn ${getLang() === "de" ? "primary" : ""}" data-l="de">Deutsch</button>
        <button class="btn ${getLang() === "en" ? "primary" : ""}" data-l="en">English</button>
      </div>
    </div>`);
  lang.querySelectorAll("[data-l]").forEach((b) =>
    b.addEventListener("click", () => {
      s.lang = b.dataset.l; setLang(s.lang);
      document.documentElement.lang = s.lang;
      applyStaticI18n();
      saveGame(); render();
    }));
  $view.appendChild(lang);

  // Stats
  $view.appendChild(el(`
    <div class="card">
      <div class="section-title" style="margin-top:0">${t("settings.stats")}</div>
      <div class="row"><span class="muted">${t("settings.totalEarned")}</span><span>¢${fmt(s.stats.totalEarned)}</span></div>
      <div class="row"><span class="muted">${t("settings.playtime")}</span><span>${fmtTime(playSec)}</span></div>
    </div>`));

  // Save / load / reset
  const data = el(`
    <div class="card">
      <div class="btn-row"><button class="btn export" style="flex:1">${t("settings.save")}</button></div>
      <div class="btn-row"><button class="btn import" style="flex:1">${t("settings.load")}</button></div>
      <div class="btn-row"><button class="btn ghost reset" style="flex:1;color:var(--bad);border-color:var(--bad)">${t("settings.reset")}</button></div>
    </div>`);
  data.querySelector(".export").addEventListener("click", async () => {
    const code = exportSave();
    try { await navigator.clipboard.writeText(code); toast(t("toast.saved"), "good"); }
    catch { prompt(t("settings.save"), code); }
  });
  data.querySelector(".import").addEventListener("click", () => {
    const code = prompt(t("settings.load"));
    if (!code) return;
    try { importSave(code); setLang(getState().lang); toast(t("toast.imported"), "good"); render(); }
    catch { toast(t("toast.importFailed"), "bad"); }
  });
  data.querySelector(".reset").addEventListener("click", () => {
    if (confirm(t("settings.resetConfirm"))) { resetGame(); setLang(getState().lang); render(); }
  });
  $view.appendChild(data);

  $view.appendChild(el(`<div class="card intro">${t("settings.about")}</div>`));
}

// ---------- Nav wiring ----------
export function wireNav() {
  $nav.querySelectorAll(".nav-btn").forEach((b) =>
    b.addEventListener("click", () => { getState().activeTab = b.dataset.tab; render(); }));
}
