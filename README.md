# DynaTech 🚀

Ein mobiles Weltraum-Wirtschaftsspiel – eine Hommage an **Dynatech (1992)**, die
Echtzeit-Wirtschaftssimulation von Eleven Software / Magic Bytes. Die Erde ist
ausgebeutet, der Konzern DYNATECH erschließt fremde Planeten: Baue Minen, veredle
Rohstoffe zu Waren und handle mit deiner Raumflotte zwischen den Planeten.

> Mobile-first PWA in purem HTML/CSS/JavaScript – kein Build-Schritt nötig.
> Sprache: Deutsch (Standard) + Englisch, umschaltbar im Spiel.

## Spielen

```bash
npm start        # startet einen lokalen Server auf http://localhost:8000
# oder ohne Node:
python3 -m http.server 8000
```

Dann im (Handy-)Browser öffnen. Über das Browser-Menü „Zum Startbildschirm
hinzufügen" lässt sich das Spiel als App installieren (PWA, läuft offline).

## Spielprinzip (Kern-Loop)

| Element        | Beschreibung |
|----------------|--------------|
| **Rohstoffe**  | Öl, Erz, Wasser – per Bohrturm, Mine, Wasserwerk gefördert (abhängig vom Planeten-Vorkommen). |
| **Produktion** | Fabriken veredeln Rohstoffe → Nahrung, Konsumgüter, Maschinen. |
| **Markt**      | Jeder Planet hat lokale Preise nach Angebot & Nachfrage. Verkaufen senkt den Preis, er erholt sich mit der Zeit. |
| **Flotte**     | Frachter, Tanker und Kühlschiffe transportieren Waren zwischen Planeten und nutzen Preisunterschiede (Arbitrage). |
| **Planeten**   | Weitere Welten erschließen – jede mit eigenen Vorkommen, Bevölkerung und Marktlage. |
| **Lager**      | Begrenzte Kapazität pro Planet; Lagerhallen erhöhen sie. |
| **Offline**    | Produktion läuft weiter; bei Rückkehr werden Erträge nachgerechnet. |

## Projektstruktur

```
index.html              App-Shell + Layout
css/style.css           Retro-Sci-Fi-UI, mobile-first
js/
  data.js               Spieldefinitionen + Wirtschaftsformeln (Balancing)
  state.js              Spielstand, Speichern/Laden, Migration
  engine.js             Simulation (Tick) + Spielaktionen
  ui.js                 Rendering & Interaktion (alle Tabs)
  i18n.js               Lokalisierung DE/EN
  format.js             Zahlen-/Zeitformatierung
  main.js               Bootstrap, Spielschleife, Offline-Progress
manifest.webmanifest    PWA-Manifest
sw.js                   Service Worker (Offline-Cache)
icons/                  App-Icons (SVG)
serve.mjs               Dev-Server ohne Abhängigkeiten
```

## App-Store / Mobile-Verpackung (später)

Die PWA lässt sich mit **[Capacitor](https://capacitorjs.com/)** zu nativen
iOS-/Android-Apps verpacken:

```bash
npm i @capacitor/core @capacitor/cli
npx cap init DynaTech com.example.dynatech
npx cap add ios && npx cap add android
# webDir auf das Projektverzeichnis zeigen lassen, dann:
npx cap sync
```

Für den Store werden zusätzlich PNG-Icons in mehreren Größen benötigt
(aus `icons/icon.svg` generierbar).

## Roadmap-Ideen

- Spezialisierte Schiffsrouten-Optimierung & automatische Arbitrage-Hinweise
- Forschung/Upgrades (Effizienz, Lager, Schiffstempo)
- Ereignisse (Markt-Booms, Engpässe, Piraten)
- Prestige/Konzern-Ränge
- Soundeffekte & Animationen
- PNG-Icon-Pipeline für App-Stores

## Lizenz

Eigenständige Hommage; keine Originalinhalte von Dynatech (1992).
