// Game state: defaults, persistence and migration.

import {
  PLANETS, BUILDING_IDS, RESOURCE_IDS, PLANET_BY_ID, equilibriumFactor,
} from "./data.js";

export const SAVE_KEY = "dynatech_save_v1";
export const SCHEMA_VERSION = 1;

let state = null;

export function getState() {
  return state;
}

// Build a fresh planet state object.
function makePlanetState(planetDef) {
  const buildings = {};
  for (const b of BUILDING_IDS) buildings[b] = 0;
  const stock = {};
  const price = {};
  for (const r of RESOURCE_IDS) {
    stock[r] = 0;
    price[r] = equilibriumFactor(planetDef, r); // start at equilibrium
  }
  return {
    unlocked: planetDef.unlockCost === 0,
    buildings,
    stock,
    price, // live price factor per good
  };
}

export function defaultState() {
  const planets = {};
  for (const p of PLANETS) planets[p.id] = makePlanetState(p);
  // Starter buildings so the loop runs immediately.
  const start = planets.terranova;
  start.buildings.oilRig = 1;
  start.buildings.oreMine = 1;
  start.buildings.waterPump = 1;

  return {
    version: SCHEMA_VERSION,
    lang: navigator.language && navigator.language.startsWith("en") ? "en" : "de",
    credits: 250,
    planets,
    ships: [],
    currentPlanet: "terranova",
    activeTab: "production",
    lastTick: Date.now(),
    stats: { totalEarned: 0, startedAt: Date.now() },
  };
}

// Merge a loaded save with defaults so new fields are never missing.
function migrate(loaded) {
  const base = defaultState();
  if (!loaded || typeof loaded !== "object") return base;

  const s = { ...base, ...loaded };
  s.version = SCHEMA_VERSION;
  s.stats = { ...base.stats, ...(loaded.stats || {}) };

  // Reconcile planets against current definitions.
  s.planets = {};
  for (const p of PLANETS) {
    const def = makePlanetState(p);
    const old = (loaded.planets && loaded.planets[p.id]) || {};
    s.planets[p.id] = {
      unlocked: old.unlocked ?? def.unlocked,
      buildings: { ...def.buildings, ...(old.buildings || {}) },
      stock: { ...def.stock, ...(old.stock || {}) },
      price: { ...def.price, ...(old.price || {}) },
    };
  }

  // Keep only ships that still reference valid planets.
  s.ships = Array.isArray(loaded.ships)
    ? loaded.ships.filter((sh) => sh && PLANET_BY_ID[sh.loc])
    : [];

  if (!PLANET_BY_ID[s.currentPlanet] || !s.planets[s.currentPlanet].unlocked) {
    s.currentPlanet = "terranova";
  }
  return s;
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    state = raw ? migrate(JSON.parse(raw)) : defaultState();
  } catch (e) {
    console.warn("Load failed, starting fresh:", e);
    state = defaultState();
  }
  return state;
}

export function saveGame() {
  try {
    state.lastTick = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Save failed:", e);
  }
}

export function resetGame() {
  state = defaultState();
  saveGame();
  return state;
}

export function exportSave() {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function importSave(code) {
  const parsed = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  state = migrate(parsed);
  saveGame();
  return state;
}
