// Localization. German is the default; English is fully supported.
// Add new languages by extending STRINGS.

const STRINGS = {
  de: {
    "nav.production": "Produktion",
    "nav.market": "Markt",
    "nav.fleet": "Flotte",
    "nav.planets": "Planeten",
    "nav.settings": "Mehr",

    "common.build": "Bauen",
    "common.upgrade": "Ausbauen",
    "common.buy": "Kaufen",
    "common.sell": "Verkaufen",
    "common.sellAll": "Alles verkaufen",
    "common.level": "Stufe",
    "common.locked": "Gesperrt",
    "common.unlock": "Erschließen",
    "common.capacity": "Lager",
    "common.income": "Einnahmen",
    "common.distance": "Entfernung",
    "common.population": "Bevölkerung",
    "common.deposits": "Vorkommen",
    "common.none": "keins",
    "common.idle": "wartet",
    "common.cancel": "Abbrechen",

    "prod.title": "Produktionsanlagen",
    "prod.storage": "Lagerbestand",
    "prod.noDeposit": "Kein Vorkommen auf diesem Planeten",
    "prod.full": "Lager voll",
    "prod.needs": "benötigt",

    "market.title": "Lokaler Markt",
    "market.hint": "Preise steigen bei knapper Lage und fallen, wenn du verkaufst.",
    "market.price": "Preis",
    "market.stock": "Bestand",
    "market.empty": "Nichts zu verkaufen.",

    "fleet.title": "Raumflotte",
    "fleet.buy": "Schiff kaufen",
    "fleet.noShips": "Noch keine Schiffe. Kaufe einen Frachter, um zwischen Planeten zu handeln.",
    "fleet.route": "Route",
    "fleet.cargo": "Fracht",
    "fleet.from": "Von",
    "fleet.to": "Nach",
    "fleet.good": "Ware",
    "fleet.assign": "Route setzen",
    "fleet.loading": "lädt",
    "fleet.transit": "unterwegs",
    "fleet.selling": "verkauft",
    "fleet.returning": "kehrt zurück",
    "fleet.atPlanet": "im Orbit",
    "fleet.noRoute": "Keine Route gesetzt",
    "fleet.capacity": "Kapazität",
    "fleet.speed": "Tempo",

    "planets.title": "Bekannte Planeten",
    "planets.current": "Aktuell",
    "planets.switch": "Wechseln",
    "planets.unlockCost": "Erschließungskosten",

    "settings.title": "Einstellungen",
    "settings.language": "Sprache",
    "settings.save": "Spielstand exportieren",
    "settings.load": "Spielstand importieren",
    "settings.reset": "Neues Spiel",
    "settings.resetConfirm": "Wirklich alles zurücksetzen? Dein Fortschritt geht verloren.",
    "settings.about": "DynaTech – eine Hommage an die Weltraum-Wirtschaftssimulation von 1992. Baue Minen, veredle Rohstoffe und handle mit deiner Flotte zwischen den Planeten.",
    "settings.stats": "Statistik",
    "settings.totalEarned": "Gesamt verdient",
    "settings.playtime": "Spielzeit",

    "toast.built": "Gebaut!",
    "toast.upgraded": "Ausgebaut!",
    "toast.cantAfford": "Nicht genug Credits",
    "toast.sold": "Verkauft",
    "toast.nothingToSell": "Nichts zu verkaufen",
    "toast.shipBought": "Schiff gekauft",
    "toast.planetUnlocked": "Planet erschlossen!",
    "toast.routeSet": "Route gesetzt",
    "toast.offline": "Willkommen zurück! Während deiner Abwesenheit verdient:",
    "toast.saved": "Spielstand kopiert",
    "toast.imported": "Spielstand geladen",
    "toast.importFailed": "Import fehlgeschlagen",

    "res.oil": "Öl", "res.ore": "Erz", "res.water": "Wasser",
    "res.food": "Nahrung", "res.goods": "Konsumgüter", "res.machines": "Maschinen",

    "bld.oilRig": "Ölbohrturm", "bld.oreMine": "Erzmine", "bld.waterPump": "Wasserwerk",
    "bld.foodPlant": "Nahrungsfabrik", "bld.goodsPlant": "Güterfabrik",
    "bld.machinePlant": "Maschinenfabrik", "bld.warehouse": "Lagerhalle",

    "ship.freighter": "Schüttgutfrachter", "ship.tanker": "Tanker", "ship.reefer": "Kühlschiff",

    "planet.terranova": "Terra Nova", "planet.ferrum": "Ferrum", "planet.aquaris": "Aquaris", "planet.petrol": "Petrol",
  },

  en: {
    "nav.production": "Production",
    "nav.market": "Market",
    "nav.fleet": "Fleet",
    "nav.planets": "Planets",
    "nav.settings": "More",

    "common.build": "Build",
    "common.upgrade": "Upgrade",
    "common.buy": "Buy",
    "common.sell": "Sell",
    "common.sellAll": "Sell all",
    "common.level": "Level",
    "common.locked": "Locked",
    "common.unlock": "Colonize",
    "common.capacity": "Storage",
    "common.income": "Income",
    "common.distance": "Distance",
    "common.population": "Population",
    "common.deposits": "Deposits",
    "common.none": "none",
    "common.idle": "idle",
    "common.cancel": "Cancel",

    "prod.title": "Production facilities",
    "prod.storage": "Storage",
    "prod.noDeposit": "No deposit on this planet",
    "prod.full": "Storage full",
    "prod.needs": "needs",

    "market.title": "Local market",
    "market.hint": "Prices rise when supply is scarce and drop when you sell.",
    "market.price": "Price",
    "market.stock": "Stock",
    "market.empty": "Nothing to sell.",

    "fleet.title": "Space fleet",
    "fleet.buy": "Buy ship",
    "fleet.noShips": "No ships yet. Buy a freighter to trade between planets.",
    "fleet.route": "Route",
    "fleet.cargo": "Cargo",
    "fleet.from": "From",
    "fleet.to": "To",
    "fleet.good": "Good",
    "fleet.assign": "Set route",
    "fleet.loading": "loading",
    "fleet.transit": "in transit",
    "fleet.selling": "selling",
    "fleet.returning": "returning",
    "fleet.atPlanet": "in orbit",
    "fleet.noRoute": "No route set",
    "fleet.capacity": "Capacity",
    "fleet.speed": "Speed",

    "planets.title": "Known planets",
    "planets.current": "Current",
    "planets.switch": "Switch",
    "planets.unlockCost": "Colonization cost",

    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.save": "Export save",
    "settings.load": "Import save",
    "settings.reset": "New game",
    "settings.resetConfirm": "Really reset everything? Your progress will be lost.",
    "settings.about": "DynaTech – a homage to the 1992 space economy simulation. Build mines, refine resources and trade across planets with your fleet.",
    "settings.stats": "Statistics",
    "settings.totalEarned": "Total earned",
    "settings.playtime": "Play time",

    "toast.built": "Built!",
    "toast.upgraded": "Upgraded!",
    "toast.cantAfford": "Not enough credits",
    "toast.sold": "Sold",
    "toast.nothingToSell": "Nothing to sell",
    "toast.shipBought": "Ship purchased",
    "toast.planetUnlocked": "Planet colonized!",
    "toast.routeSet": "Route set",
    "toast.offline": "Welcome back! Earned while away:",
    "toast.saved": "Save copied",
    "toast.imported": "Save loaded",
    "toast.importFailed": "Import failed",

    "res.oil": "Oil", "res.ore": "Ore", "res.water": "Water",
    "res.food": "Food", "res.goods": "Consumer goods", "res.machines": "Machines",

    "bld.oilRig": "Oil rig", "bld.oreMine": "Ore mine", "bld.waterPump": "Water plant",
    "bld.foodPlant": "Food factory", "bld.goodsPlant": "Goods factory",
    "bld.machinePlant": "Machine factory", "bld.warehouse": "Warehouse",

    "ship.freighter": "Bulk freighter", "ship.tanker": "Tanker", "ship.reefer": "Reefer ship",

    "planet.terranova": "Terra Nova", "planet.ferrum": "Ferrum", "planet.aquaris": "Aquaris", "planet.petrol": "Petrol",
  },
};

let current = "de";

export function setLang(lang) {
  if (STRINGS[lang]) current = lang;
}
export function getLang() {
  return current;
}
export function t(key) {
  return (STRINGS[current] && STRINGS[current][key]) || (STRINGS.de[key]) || key;
}
// Apply translations to any element with a data-i18n attribute.
export function applyStaticI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
}
