# Architekturentscheidungen (DECISIONS.md)

Dieses Dokument hält alle Festlegungen fest, bei denen die Spezifikation Spielraum lässt oder offene Punkte (O1–O6) Standardannahmen definieren.

## D1: Build-Setup mit Vite + TypeScript + `vite-plugin-pwa`
- **Entscheidung:** Einsatz von Vite, React 19, TypeScript, Tailwind CSS v4 und `vite-plugin-pwa` mit Ausgabe nach `dist/`.
- **Begründung:** Bietet typsichere Generatoren, Prüfer und Diagnoselogik sowie einen zuverlässigen Cache-First Service Worker ohne Laufzeit-Abhängigkeiten zu externen CDNs. `dist/` ist vollständig statisch auslieferbar.

## D2: Lokale Schriftarten ohne CDN-Zugriff
- **Entscheidung:** Verzicht auf Google Fonts oder externe Schrift-CDNs; Einsatz einer klaren, runden System-Schriftfamilie (`"SF Pro Rounded", "Quicksand", "Nunito", "Segoe UI Rounded", "DejaVu Sans", sans-serif`) kombiniert mit selbst gezeichneten SVG-Vorlageziffern (klare Unterscheidung von 1, 4, 7).
- **Begründung:** Erfüllt Nicht-Verhandelbar #7 („kein Netzwerkzugriff zur Laufzeit“) und verhindert Flackern oder Ladefehler im Offline-Betrieb.

## D3: Reine SVG/Canvas/CSS-Grafiken & WebAudio-Synthese
- **Entscheidung:** Alle Klötzchen, Tiere (Fuchs, Axolotl, Hase), Hintergründe, Partikel und Icons werden per SVG, Canvas und CSS gezeichnet; alle Töne per WebAudio synthetisiert. PNG-App-Icons werden über ein lokales Node-Skript erzeugt und als statische Dateien eingebettet.
- **Begründung:** Garantiert Markenfreiheit (kein Minecraft/LEGO), 60 fps Performance und winzige Bundle-Größe.

## D4: Zwei-Stufen-Handschrifterkennung (Geometrie + 16×16-Raster + Topologie)
- **Entscheidung:** Kombination aus normalisiertem Mehrstrich-Geometrie-Matching (mit Erhaltung des Seitenverhältnisses!), 16×16-Raster-Kosinus-Ähnlichkeit und topologischen Merkmalen (Strichzahl, Seitenverhältnis, geschlossene Schleifen, Endpunkte).
- **Begründung:** Reine Bildklassifikation verliert die Strichreihenfolge; reines 1-Strich-Matching scheitert an zweistrichigen Ziffern (4, 5, 7, 8). Die Kombination erkennt alle Kinder-Varianten robust in < 5 ms und erlaubt präzise Erkennung gespiegelter Ziffern.

## D5: Schutz gegen stille Fehlerkennung bei Verwechslungsgruppen
- **Entscheidung:** Wenn Platz 1 und Platz 2 in einer bekannten Verwechslungsgruppe (`1/7`, `4/9`, `0/6`, `5/6`, `2/7`, `3/8`) liegen und die Wahrscheinlichkeitsdifferenz unter `0.30` liegt, wird immer die Rückfrage („Meinst du eine 7 oder eine 1?“) ausgelöst. Die Lösung der Aufgabe wird dem Erkenner niemals mitgeteilt.
- **Begründung:** Erfüllt Spezifikation 5.3 („darf niemals eine falsche Antwort stillschweigend zur richtigen machen“) und hält die Falschannahme-Rate im Testbett unter 1 %.

## D6: Standardannahmen für offene Punkte (O1–O6)
- **O1 (Zahlenstrahl-Zählweise):** `strichZaehlung: "start_zaehlt_nicht"` (Standard). Konfigurierbar im Elternbereich.
- **O2 (Hundertertafel-Bezeichnung):** Tafel 1–100 als Bauplatte (Zeile 1 oben = 1–10, Spalte 1 links), Punktfeld als zuschaltbare Hilfe. Beginn ab 0 in Konfiguration umstellbar.
- **O3 (Zahlenmauer):** 3 Stockwerke bis 20, danach 3 Stockwerke bis 100, später 4 Stockwerke.
- **O4 (Hosting):** Statischer `dist/`-Build, geeignet für jeden HTTPS-Webspace, Netlify oder GitHub Pages.
- **O5 (Zielgerät & Eingabe):** Android-Tablet (Querformat bevorzugt, Hochformat voll unterstützt), Finger/Stift/Maus mit Handballen-Ablehnung.
- **O6 (Spielzeit-Grenze):** Pausenhinweis nach 15 Minuten (Tier gähnt sanft), keine harte Sperre als Standard (optional im Elternbereich einstellbar).

## D7: Farbblindheits-sichere Stellenwert-Codierung
- **Entscheidung:** Zehner sind immer Blau (`#2563EB`) **plus** vertikales Zehnerstangen-Symbol (`|`); Einer sind immer Rot (`#E11D48`) **plus** Einerwürfel-Symbol (`▪`). Fehlermeldungen oder Hinweise verwenden **niemals** Rot, sondern warmes Honig-Bernstein (`#F59E0B` / `#FFFBEB`).
- **Begründung:** Verbindet Spezifikation 2.2/5.1 mit Nicht-Verhandelbar #3 und Barrierefreiheit (Farbe + Form/Position).

## D8: Animierte Sticker-Serien, Puzzle-Bilder & Offline-Caching
- **Entscheidung:** Die 14 animierten GIF-Stickerserien (353 Sticker unter `public/assets/stickers/<Serie>/`) werden per `CacheFirst`-`runtimeCaching` im Service Worker beim ersten Laden offline gespeichert, während die 15 sechsteiligen Puzzle-Bilder (`3×2`-Kacheln) zusammen mit den Welt-Hintergründen direkt im Precache liegen.
- **Begründung:** Vermeidet einen ~160-MB-Zwangsdownload bei der Erstinstallation, hält die Puzzle-Bilder sofort offline verfügbar und schaltet pro Truhe sowohl einen neuen Sticker als auch ein verdecktes Puzzleteil mit Doppelschutz frei.

