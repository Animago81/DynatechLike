// Simulation engine: the per-tick economy plus all player actions.

import {
  BUILDINGS, RECIPES, RESOURCES, RESOURCE_IDS, SHIPS, PLANET_BY_ID,
  buildingCost, planetCapacity, planetStockTotal, equilibriumFactor,
  sellPrice, travelTime,
} from "./data.js";
import { getState } from "./state.js";

// ---------- Production rates (for display & simulation) ----------

// Raw extraction per second for a building on a planet.
function extractionRate(planetDef, buildingId, level) {
  const b = BUILDINGS[buildingId];
  if (!b.produces) return 0;
  const dep = planetDef.deposits[b.produces] || 0;
  return b.rate * level * dep;
}

// Returns net production per second per good for a planet (ignoring caps),
// used for the income/throughput display.
export function planetNetRates(planetId) {
  const s = getState();
  const ps = s.planets[planetId];
  const def = PLANET_BY_ID[planetId];
  const net = {};
  for (const r of RESOURCE_IDS) net[r] = 0;

  for (const bId of Object.keys(ps.buildings)) {
    const lvl = ps.buildings[bId];
    if (!lvl) continue;
    const b = BUILDINGS[bId];
    if (b.produces) {
      net[b.produces] += extractionRate(def, bId, lvl);
    } else if (b.recipe) {
      const rec = RECIPES[b.recipe];
      const throughput = b.rate * lvl;
      for (const [g, q] of Object.entries(rec.in)) net[g] -= q * throughput;
      for (const [g, q] of Object.entries(rec.out)) net[g] += q * throughput;
    }
  }
  return net;
}

// ---------- The simulation step (dt in seconds) ----------

export function simulate(dt) {
  const s = getState();
  if (dt <= 0) return;
  // Cap a single step so huge offline gaps stay stable; loop in chunks.
  const STEP = 1; // seconds per chunk
  let remaining = Math.min(dt, 60 * 60 * 24 * 7); // clamp to 7 days max
  while (remaining > 0) {
    const step = Math.min(STEP, remaining);
    stepOnce(step);
    remaining -= step;
  }
}

function stepOnce(dt) {
  const s = getState();
  for (const planetId of Object.keys(s.planets)) {
    const ps = s.planets[planetId];
    if (!ps.unlocked) continue;
    produce(planetId, ps, dt);
    driftPrices(planetId, ps, dt);
  }
  runShips(dt);
}

// Extraction + factory conversion, respecting storage capacity.
function produce(planetId, ps, dt) {
  const def = PLANET_BY_ID[planetId];
  const cap = planetCapacity(ps);

  // 1) Raw extraction.
  for (const bId of Object.keys(ps.buildings)) {
    const lvl = ps.buildings[bId];
    if (!lvl) continue;
    const b = BUILDINGS[bId];
    if (!b.produces) continue;
    const add = extractionRate(def, bId, lvl) * dt;
    if (add <= 0) continue;
    const free = cap - planetStockTotal(ps);
    if (free <= 0) break;
    ps.stock[b.produces] += Math.min(add, free);
  }

  // 2) Factory conversion (only if inputs and space available).
  for (const bId of Object.keys(ps.buildings)) {
    const lvl = ps.buildings[bId];
    if (!lvl) continue;
    const b = BUILDINGS[bId];
    if (!b.recipe) continue;
    const rec = RECIPES[b.recipe];
    let runs = b.rate * lvl * dt; // desired output units

    // Limit by available inputs.
    for (const [g, q] of Object.entries(rec.in)) {
      runs = Math.min(runs, ps.stock[g] / q);
    }
    // Limit by free storage (net change in total stock).
    const inPer = Object.values(rec.in).reduce((a, b2) => a + b2, 0);
    const outPer = Object.values(rec.out).reduce((a, b2) => a + b2, 0);
    const netPer = outPer - inPer;
    if (netPer > 0) {
      const free = cap - planetStockTotal(ps);
      if (free <= 0) continue;
      runs = Math.min(runs, free / netPer);
    }
    if (runs <= 0) continue;

    for (const [g, q] of Object.entries(rec.in)) ps.stock[g] -= q * runs;
    for (const [g, q] of Object.entries(rec.out)) ps.stock[g] += q * runs;
  }
}

// Prices recover toward their equilibrium over time.
function driftPrices(planetId, ps, dt) {
  const def = PLANET_BY_ID[planetId];
  const RECOVER = 0.06; // per second toward equilibrium
  for (const g of RESOURCE_IDS) {
    const eq = equilibriumFactor(def, g);
    ps.price[g] += (eq - ps.price[g]) * Math.min(1, RECOVER * dt);
  }
}

// ---------- Selling ----------

// Core market sale: sells `amount` of `good` on a planet's market, applying
// price impact and crediting the player. Does NOT touch planet storage —
// callers decide where the goods come from (local stock or a ship's cargo).
export function marketSell(planetId, good, amount) {
  if (amount <= 0) return 0;
  const s = getState();
  const ps = s.planets[planetId];
  const def = PLANET_BY_ID[planetId];
  let earned = 0;
  let left = amount;
  const SLICE = Math.max(1, amount / 20);
  while (left > 0) {
    const q = Math.min(SLICE, left);
    earned += sellPrice(good, ps.price[good]) * q;
    // Price impact: selling raises supply, factor drops.
    const impact = (q / (40 + amount)) * 0.5;
    ps.price[good] = Math.max(equilibriumFactor(def, good) * 0.35, ps.price[good] - impact);
    left -= q;
  }
  s.credits += earned;
  s.stats.totalEarned += earned;
  return earned;
}

// Sell `amount` of `good` from a planet's local storage on its market.
export function sellGood(planetId, good, amount) {
  const ps = getState().planets[planetId];
  amount = Math.min(amount, ps.stock[good]);
  if (amount <= 0) return 0;
  ps.stock[good] -= amount;
  return marketSell(planetId, good, amount);
}

// ---------- Buildings ----------

export function canBuild(planetId, buildingId) {
  const s = getState();
  const ps = s.planets[planetId];
  const def = PLANET_BY_ID[planetId];
  const b = BUILDINGS[buildingId];
  if (b.produces && (def.deposits[b.produces] || 0) <= 0) return false; // no deposit
  return s.credits >= buildingCost(buildingId, ps.buildings[buildingId]);
}

export function build(planetId, buildingId) {
  const s = getState();
  const ps = s.planets[planetId];
  if (!canBuild(planetId, buildingId)) return false;
  const cost = buildingCost(buildingId, ps.buildings[buildingId]);
  s.credits -= cost;
  ps.buildings[buildingId] += 1;
  return true;
}

// ---------- Planets ----------

export function unlockPlanet(planetId) {
  const s = getState();
  const def = PLANET_BY_ID[planetId];
  const ps = s.planets[planetId];
  if (ps.unlocked) return false;
  if (s.credits < def.unlockCost) return false;
  s.credits -= def.unlockCost;
  ps.unlocked = true;
  return true;
}

// ---------- Ships ----------

let shipSeq = 1;

export function buyShip(type) {
  const s = getState();
  const def = SHIPS[type];
  if (!def || s.credits < def.cost) return false;
  s.credits -= def.cost;
  s.ships.push({
    id: "s" + Date.now().toString(36) + shipSeq++,
    type,
    loc: s.currentPlanet,
    route: null, // { good, from, to }
    phase: "idle", // idle | loading | transit | selling | returning
    progress: 0, // 0..1 within current phase
    cargoGood: null,
    cargoAmt: 0,
  });
  return true;
}

export function setRoute(shipId, good, from, to) {
  const s = getState();
  const ship = s.ships.find((x) => x.id === shipId);
  if (!ship) return false;
  if (from === to) return false;
  ship.route = { good, from, to };
  ship.loc = from;
  ship.phase = "loading";
  ship.progress = 0;
  ship.cargoGood = null;
  ship.cargoAmt = 0;
  return true;
}

export function shipCanCarry(type, good) {
  const c = SHIPS[type].cargo;
  return c === "any" || (Array.isArray(c) && c.includes(good));
}

const LOAD_TIME = 4; // seconds to load / unload

function runShips(dt) {
  const s = getState();
  for (const ship of s.ships) {
    if (!ship.route) continue;
    const def = SHIPS[ship.type];
    const from = PLANET_BY_ID[ship.route.from];
    const to = PLANET_BY_ID[ship.route.to];
    const fromPs = s.planets[ship.route.from];
    const toPs = s.planets[ship.route.to];
    if (!fromPs.unlocked || !toPs.unlocked) continue;

    switch (ship.phase) {
      case "loading": {
        ship.progress += dt / LOAD_TIME;
        if (ship.progress >= 1) {
          // Load up to capacity from source stock.
          const amt = Math.min(def.capacity, fromPs.stock[ship.route.good]);
          fromPs.stock[ship.route.good] -= amt;
          ship.cargoGood = ship.route.good;
          ship.cargoAmt = amt;
          ship.phase = amt > 0 ? "transit" : "idleWait";
          ship.progress = 0;
        }
        break;
      }
      case "idleWait": {
        // Nothing to load; wait a bit then retry loading.
        ship.progress += dt / 3;
        if (ship.progress >= 1) { ship.phase = "loading"; ship.progress = 0; }
        break;
      }
      case "transit": {
        const tt = travelTime(from, to, def);
        ship.progress += dt / tt;
        if (ship.progress >= 1) { ship.phase = "selling"; ship.progress = 0; ship.loc = ship.route.to; }
        break;
      }
      case "selling": {
        ship.progress += dt / LOAD_TIME;
        if (ship.progress >= 1) {
          if (ship.cargoAmt > 0) {
            // Sell the cargo directly on the destination market.
            marketSell(ship.route.to, ship.cargoGood, ship.cargoAmt);
          }
          ship.cargoAmt = 0;
          ship.cargoGood = null;
          ship.phase = "returning";
          ship.progress = 0;
        }
        break;
      }
      case "returning": {
        const tt = travelTime(to, from, def);
        ship.progress += dt / tt;
        if (ship.progress >= 1) { ship.phase = "loading"; ship.progress = 0; ship.loc = ship.route.from; }
        break;
      }
      default:
        ship.phase = "loading";
    }
  }
}

// Total credits/sec estimate across all unlocked planets (production value sold locally).
// Used only for the headline income readout.
export function estimateIncomePerSec() {
  const s = getState();
  let total = 0;
  for (const planetId of Object.keys(s.planets)) {
    const ps = s.planets[planetId];
    if (!ps.unlocked) continue;
    const rates = planetNetRates(planetId);
    for (const g of RESOURCE_IDS) {
      if (rates[g] > 0) total += rates[g] * sellPrice(g, ps.price[g]);
    }
  }
  return total;
}
