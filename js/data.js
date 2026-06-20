// Static game definitions and the economic formulas derived from them.
// All balancing lives here so it is easy to tune.

// ---------- Resources / goods ----------
// kind: "raw" = mined, "product" = manufactured.
export const RESOURCES = {
  oil:      { icon: "🛢️", kind: "raw",     basePrice: 2.0,  liquid: true },
  ore:      { icon: "⛰️", kind: "raw",     basePrice: 2.2,  liquid: false },
  water:    { icon: "💧", kind: "raw",     basePrice: 1.5,  liquid: true },
  food:     { icon: "🥦", kind: "product", basePrice: 9.0,  perishable: true },
  goods:    { icon: "📦", kind: "product", basePrice: 14.0 },
  machines: { icon: "⚙️", kind: "product", basePrice: 34.0 },
};
export const RESOURCE_IDS = Object.keys(RESOURCES);
export const RAW_IDS = RESOURCE_IDS.filter((r) => RESOURCES[r].kind === "raw");
export const PRODUCT_IDS = RESOURCE_IDS.filter((r) => RESOURCES[r].kind === "product");

// ---------- Recipes (used by factories) ----------
export const RECIPES = {
  food:     { in: { water: 2, oil: 1 }, out: { food: 1 } },
  goods:    { in: { ore: 2, oil: 1 },   out: { goods: 1 } },
  machines: { in: { ore: 1, goods: 1 }, out: { machines: 1 } },
};

// ---------- Buildings ----------
// produces: raw resource id (extractor) — needs a planet deposit > 0.
// recipe: recipe id (factory).
// capacity: warehouse storage bonus.
// rate = units per second at level 1; scales linearly with level.
export const BUILDINGS = {
  oilRig:      { produces: "oil",   rate: 0.8, baseCost: 60,  costMult: 1.18, icon: "🛢️" },
  oreMine:     { produces: "ore",   rate: 0.8, baseCost: 60,  costMult: 1.18, icon: "⛏️" },
  waterPump:   { produces: "water", rate: 1.0, baseCost: 45,  costMult: 1.18, icon: "🚰" },
  foodPlant:   { recipe: "food",    rate: 0.5, baseCost: 140, costMult: 1.20, icon: "🌾" },
  goodsPlant:  { recipe: "goods",   rate: 0.5, baseCost: 180, costMult: 1.20, icon: "🏭" },
  machinePlant:{ recipe: "machines",rate: 0.4, baseCost: 380, costMult: 1.22, icon: "🛠️" },
  warehouse:   { capacity: 250,     baseCost: 120, costMult: 1.25, icon: "📦" },
};
export const BUILDING_IDS = Object.keys(BUILDINGS);

// ---------- Planets ----------
// deposits: richness multiplier per raw resource (0 = cannot be mined here).
// population: drives demand (and price) for products.
// distance: position on the trade lane (used for ship travel time).
export const PLANETS = [
  { id: "terranova", color: "#4aa3ff", deposits: { oil: 1.0, ore: 1.0, water: 1.2 }, population: 1.0, distance: 0,  unlockCost: 0 },
  { id: "ferrum",    color: "#ff8a5c", deposits: { oil: 0.0, ore: 2.4, water: 0.4 }, population: 0.6, distance: 3,  unlockCost: 6000 },
  { id: "aquaris",   color: "#38e1b0", deposits: { oil: 0.3, ore: 0.0, water: 2.6 }, population: 0.9, distance: 6,  unlockCost: 22000 },
  { id: "petrol",    color: "#ffcf5c", deposits: { oil: 2.6, ore: 0.5, water: 0.0 }, population: 0.5, distance: 10, unlockCost: 70000 },
];
export const PLANET_BY_ID = Object.fromEntries(PLANETS.map((p) => [p.id, p]));

// ---------- Ships ----------
// cargo: which goods this ship may carry ("any" = all).
// capacity: max units per trip. speed: travel speed (distance units per second-ish).
export const SHIPS = {
  freighter: { capacity: 60,  speed: 1.0, cost: 2500,  cargo: "any", icon: "🚀" },
  tanker:    { capacity: 160, speed: 0.8, cost: 7000,  cargo: ["oil", "water"], icon: "🛰️" },
  reefer:    { capacity: 90,  speed: 1.2, cost: 9000,  cargo: ["food"], icon: "🛸" },
};
export const SHIP_IDS = Object.keys(SHIPS);

// ---------- Derived formulas ----------

// Cost to go from current level to the next.
export function buildingCost(buildingId, level) {
  const b = BUILDINGS[buildingId];
  return Math.ceil(b.baseCost * Math.pow(b.costMult, level));
}

// Total storage capacity on a planet.
export function planetCapacity(planetState) {
  const base = 400;
  const wh = planetState.buildings.warehouse || 0;
  return base + wh * BUILDINGS.warehouse.capacity;
}

// Sum of everything stored on a planet.
export function planetStockTotal(planetState) {
  return RESOURCE_IDS.reduce((s, r) => s + (planetState.stock[r] || 0), 0);
}

// Equilibrium price factor for a good on a planet (around 1.0).
// Raw goods: scarce locally (low deposit) -> higher price -> import target.
// Products: more populated planets demand more -> higher price.
export function equilibriumFactor(planetDef, good) {
  const res = RESOURCES[good];
  if (res.kind === "raw") {
    const dep = planetDef.deposits[good] || 0;
    return clampNum(1.6 - 0.32 * dep, 0.6, 1.8);
  }
  return clampNum(0.7 + planetDef.population * 0.6, 0.7, 1.6);
}

// Current sell price = basePrice * live price factor.
export function sellPrice(good, factor) {
  return RESOURCES[good].basePrice * factor;
}

// Travel time (seconds) for a ship between two planets.
export function travelTime(fromDef, toDef, ship) {
  const dist = Math.abs(fromDef.distance - toDef.distance) + 1;
  return (dist / ship.speed) * 6; // 6s per distance unit at speed 1
}

function clampNum(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
