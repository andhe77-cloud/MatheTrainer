# Projektplan: Klötzchen-Abenteuer (Mathe-Lernspiel 2. Klasse Bayern)

## 1. Architektur & Ordnerstruktur

Die Anwendung wird als offline-fähige, installierbare Progressive Web App (PWA) mit React 19, TypeScript, Tailwind CSS v4 und Vite (`vite-plugin-pwa`) gebaut. Das produktive Build-Artefakt liegt im Ordner `dist/`.

### Ordnerstruktur (nach Spezifikation 12)
```
/index.html                 Einstiegspunkt mit PWA- & Mobile-Meta-Tags
/vite.config.ts             Vite + Tailwind + VitePWA (Cache-First, Offline, Fullscreen)
/public/icons/              Generierte PNG- & SVG-Icons (192, 512, maskable-512, apple-touch 180)
/src/
  core/                     Zustand, Seeded RNG, IndexedDB-Speicher + Migrationen, Audio, Sprachausgabe, Router
  content/                  Konfigurationen, strings.de.ts (alle sichtbaren Texte), Itemkatalog (ab M6)
  input/                    Ziffernkästchen, Pointer-Stricherfassung, Handballen-Ablehnung, Erkenner, Rückfrage, Schreibtraining, Testbett
  tasks/                    Aufgabenmodule (Hundertertafel, Zahlenstrahl, Zehnerübergang, Rechnen, Zahlenmauer)
  diagnostics/              Fehlermodell, Mustererkennung, Elternempfehlungen, Aufgaben-Protokoll
  rewards/                  Münzen, Sterne, Truhen mit Doppelschutz, Shop, Serien-Album
  ui/                       Szenen (Begrüßung/Tierwahl, Karte, Level, Truhe, Hub-Insel, Shop, Album, Elternbereich) & Designsystem
/tests/                     Automatisierte Einheitentests + Handschrift-Erkennungs-Testbett
```

Begründung zur Abweichung von rohem ES-Module-Setup ohne Bundler: Vite + TypeScript + `vite-plugin-pwa` erlaubt typsichere Module, sauberes CSS-Bundling ohne CDN und einen verlässlichen Workbox Cache-First Service Worker. Das fertige Ergebnis wird in `dist/` ausgeliefert (gemäß Spezifikation 12).

## 2. Meilensteine & Abnahme-Status

### M0: Gerüst & Designsystem
- [x] PWA-Manifest (`display: "fullscreen"`), Service Worker (Cache-First offline), PNG/SVG-Icons (192, 512, maskable, Apple Touch) — *erfüllt*
- [x] Szenen-Router (`welcome`, `training`, `map`, `level`, `chest`, `hub`, `shop`, `album`, `practice`, `parent`) — *erfüllt* (Basis-Szenen aktiv, Spiel-/Elternszenen folgen in M2–M7)
- [x] IndexedDB-Speicher mit Schema-Versionierung, Migrationen, `navigator.storage.persist()` und JSON-Export/Import — *erfüllt*
- [x] Konfigurations- und Textsystem (`config.ts`, `strings.de.ts` mit >= 5 Varianten pro Situation) — *erfüllt*
- [x] Klötzchen-Designsystem (Zehner blau + Stangen-Symbol, Einer rot + Würfel-Symbol, kein Rot für Fehler, >= 64dp Touch-Ziele, Weniger Bewegung, Linkshänder-Modus) — *erfüllt*
- [x] Tier-Maskottchen (Fuchs, Axolotl, Hase) als eigene SVG-Klötzchenfiguren mit Animationszuständen (`idle`, `hop`, `happy`, `hm`, `tired`, `yawn`, `nod`) + WebAudio-Töne — *erfüllt*

### M1: Schreibeingabe & Lokale Ziffernerkennung
- [x] Ziffernkästchen (Zehner blau / Einer rot / Hunderter optional, Grund- und Mittellinie, >= 96×120 dp, Radieren & Rückgängig, „Fertig“-Knopf ohne Auto-Submit) — *erfüllt*
- [x] Pointer-Events mit `touch-action: none` und Handballen-Ablehnung (große Touch-Kontakte bei aktivem Stift werden ignoriert) — *erfüllt*
- [x] Lokaler Erkenner (Strich-Resampling + Template-Matching mit Varianten + 16×16 Raster + Topologie + Kind-Vorlagen bis 20/Ziffer) — *erfüllt*
- [x] Entscheidungslogik: Eindeutig / Rückfrage (inkl. Verwechslungsgruppen 1/7, 4/9, 0/6, 5/6, 2/Z, 3/8) / Unleserlich / Gespiegelt — *erfüllt*
- [x] Schreibtraining (jede Ziffer 2× schreiben) & JSON-Sammel-/Testwerkzeug — *erfüllt*
- [x] Synthetisches + gesammeltes Testbett mit Messung (< 50 ms, >= 95 % Auto-Annahme, <= 15 % Rückfrage, <= 1 % Falschannahme) — *erfüllt* (100.0 % Genauigkeit, 2.2 % Rückfrage, 0.00 % Falschannahme, ~0.91 ms Ø)

#### Selbstkontrolle nach M1 (Spezifikation 14 & Nicht-Verhandelbar)
| Kriterium | Status | Begründung |
|---|---|---|
| Handschrift-Kern (Zehner blau / Einer rot, Rückfrage, keine stille Umdeutung) | erfüllt | Erkenner erhält keine Aufgabenlösung; strenge Verwechslungsgruppen-Schwelle |
| Eigener Klötzchen-Look, keine Marken/Fremdassets | erfüllt | Alle Tiere, Icons, Bauklötze und Töne per SVG/Canvas/CSS/WebAudio erzeugt |
| Offline & Privat (keine CDNs, keine Fremdschriften, lokal IndexedDB) | erfüllt | VitePWA Cache-First, System-Rundschrift, kein externer Netzwerkzugriff |
| Inhalte & Schwellenwerte als Daten (`config.ts`, `strings.de.ts`) | erfüllt | Alle Texte & Erkennungsschwellen ausgelagert |
| Welten 1–5, Hüpfer, Belohnungssystem, Diagnose, Elternbereich | offen | Planmäßig für M2–M7 vorgesehen |

### M2: Welt 1 Hundertertafel
- [x] Generatoren (Nachbarfelder 4er/8er, Wege, Zeile/Spalte, Lücken, Zahl finden) über 8 Level — *erfüllt*
- [x] Prüfer, Fehlermodell H1–H7, Tier-Hüpfer mit Tonleiter & Zahlwort (`80 + 4`), Hilfestufen 1–3, Punktfeld-Ansicht, Entdecker-Modus — *erfüllt*
- [x] Hauptbildschirm kindgerecht als sonnige Klötzchen-Abenteuerkarte mit Dioramen neu gestaltet & Schrifterkennung für 8 und 9 verbessert — *erfüllt*

#### Selbstkontrolle nach M2 (Spezifikation 14 & Nicht-Verhandelbar)
| Kriterium | Status | Begründung |
|---|---|---|
| Welt 1 alle 8 Level + 6 Typen + Punktfeld-Hilfe | erfüllt | Deterministisch je Seed, konfigurierbar über `tafelStart` |
| Tier-Hüpfer + steigende Tonleiter + Zahlwort (`80 + 4`) | erfüllt | Hüpft auf Tafel/Ausschnitt, max. 3s, antippbar zum Überspringen |
| Sanfter Fehler-Umgang + Hilfestufen 1–3 + Abschreiben + Wiedervorlage | erfüllt | Kein Rot, kein „falsch“, Entdecker-Modus bei 0 Herzen |
| Fehlermodell H1–H7 | erfüllt | Alle 7 Kategorien H1–H7 generiert und in `world1.test.ts` geprüft |
| Welten 2–5, Truhen/Hub/Shop/Album, Diagnose-Dashboard | offen | Planmäßig für M3–M7 vorgesehen |

### M3: Welt 2 Zahlenstrahl
- [x] Brücke/Gleis-Visualisierung, alle 5 Typen (`strich_zu_zahl`, `zahl_zu_strich`, `strich_zaehlen`, `luecken_strahl`, `zwischenzahl`), O1 (`strichZaehlung`) konfigurierbar, Fehlermodell Z1–Z5 — *erfüllt*

### M4: Spielschleife & Ökonomie
- [x] Herzen (3), Entdecker-Modus, Goldklötzchen, Sterne, Truhenöffnung mit Doppelschutz, Levelkarte (Welten 1–5), Tagesabenteuer, adaptive Schwierigkeit (3er-Serie hoch / 2er-Fehler runter / 1-3-7 Tage), Pausenhinweis (5 Varianten) — *erfüllt*

### M5: Welten 3–5
- [x] Zehnerübergang (`uebergang_plus`, `uebergang_minus`, `ergaenzen_zehner`, `ergaenzen_100`, `zerlegen`, R1–R7), Rechenwerkstatt (`zehneruebergangEnabled` schaltbar), Zahlenmauer (O3: 3er bis 20 → 3er bis 100 → 4er, M1–M3) — *erfüllt*

### M6: Hub, Shop, Album, Tieranpassung, Wunschzettel
- [x] 2.5D-Klötzchen-Bauplatz (`HubScene`, 8×4 Raster, Ziehen/Platzieren/Drehen/Wegnehmen, wiegende Pflanzen), 48 Katalog-Items zu festen Preisen, 3 Album-Serien mit 27 Stickern + Wissenssätzen, Wunschzettel, Tier-Accessoires & Hüpfeffekte — *erfüllt*

### M7: Diagnose & Elternbereich
- [x] Mustererkennung (`>= 3/12` oder `>= 25%/20`, Ende nach 8 ohne Fehler), Übungsinsel (geführte Beispiele + 4 gezielte Übungen), PIN-geschützter Elternbereich (4-stellig + Erwachsenen-Rechenaufgabe), Dashboard mit Welt-Trefferquote & kopierbarem Wochenbericht, Einstellungen (O1–O6), JSON-Export/Import, Handschrift-Testmodus — *erfüllt*

### M8: Politur & Abnahme
- [x] Scrollfreies `100dvh`-Layout & Vollbild-Umschalter (`Vollbild`-Button + PWA `display: fullscreen`), Tonmischung, 5+ Sprachtext-Varianten pro Situation, Barrierefreiheit (`Weniger Bewegung`, `Linkshänder`), 240-Runden-Dauertest, `README.md`, `PRAXIS_TESTANLEITUNG.md` — *erfüllt*

#### Abschluss-Selbstkontrolle (Spezifikation 14 & Nicht-Verhandelbar)
| Kriterium | Status | Begründung |
|---|---|---|
| Handschrift-Kern (Zehner blau / Einer rot, Rückfrage, keine stille Umdeutung) | erfüllt | 100 % Auto-Genauigkeit, 0 % Falschannahme im Testbett; Rückfrage bei Verwechslungsgruppen |
| Alle 5 Lernwelten + Tier-Hüpfer + sanfter Fehler-Umgang | erfüllt | Welten 1–5 vollständig spielbar, Hüpfer mit Tonleiter & Zahlwort, 3 Hilfestufen + Entdecker-Modus |
| Fehlermodell, Mustererkennung, Übungsinsel & Eltern-Dashboard | erfüllt | Alle Kategorien H1–H7, Z1–Z5, R1–R7, M1–M3, S1–S3 aktiv; 24/24 automatisierte Tests grün |
| Belohnungssystem (Münzen, Truhen-Doppelschutz, Shop, Hub, Album, Wunschzettel) | erfüllt | 48 Items, 27 Sticker in 3 Serien, lückenloser Doppelschutz |
| Vollbildmodus, Scrollfreiheit, Offline-PWA & Markenfreiheit | erfüllt | In Playwright (1280×800 & 768×1024) verifiziert: 0 Konsolenfehler, 0 externe Requests, 0 Überlauf |

## 3. Risiken & Gegenmaßnahmen

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Stille Fehlerkennung bei Kinderhandschrift (z. B. 1 als 7 gewertet) | Frust & falsche Fehlerdiagnose | Strenge Konfidenz- & Margen-Schwellen plus Verwechslungsgruppen-Check -> lieber Rückfrage |
| Fehlende `de-DE`-Sprachstimme auf einzelnen Android-Geräten | Zahlwort nicht hörbar | Regelbasierter deutscher Zahlwort-Text (`vierundachtzig`) + visuelle Zerlegung (`80 + 4`) immer sichtbar |
| IndexedDB-Verlust bei Browser-Bereinigung | Verlust von Fortschritt & Vorlagen | `navigator.storage.persist()` anfordern + einfacher JSON-Backup-Export im Elternbereich |
| Touch-Scrollen beim Schreiben auf Tablet | Schreiben bricht ab | `touch-action: none`, `user-select: none`, `overscroll-behavior: contain`, Handballen-Filter |
