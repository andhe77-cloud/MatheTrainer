# Klötzchen-Abenteuer (Mathe-Lernspiel · 2. Klasse Bayern)

Ein ruhiges, werbefreies und komplett offline funktionierendes Mathe-Lernspiel für Kinder (7–8 Jahre, 2. Klasse Grundschule, LehrplanPLUS Bayern). Alle Aufgaben bis 100 werden per Handschrift in farbige Ziffernkästchen geschrieben (Zehner blau, Einer rot) – lokal auf dem Gerät erkannt und ohne externe Server oder Tracker.

## Installation als Vollbild-App (Android-Tablet / Desktop)

Das Spiel ist als **Progressive Web App (PWA)** mit `"display": "fullscreen"` konfiguriert.

### Android-Tablet (Chrome / Edge)
1. Öffne die gehostete HTTPS-Adresse (oder `http://localhost:3000` im lokalen Netz) in Google Chrome.
2. Tippe rechts oben auf das **Drei-Punkte-Menü** → **„Zum Startbildschirm hinzufügen“** (oder nutze den Knopf **„Als App installieren“** direkt oben rechts im Spiel).
3. Starte „Klötzchen-Abenteuer“ über das neue App-Symbol auf dem Homescreen – das Spiel öffnet ohne Browser-Leiste im Vollbild.
4. Alternativ steht auf allen Bildschirmen oben rechts der Knopf **„Vollbild“** zur Verfügung.

### iPad / Desktop
- **iPad (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“.
- **Desktop (Chrome/Edge):** Install-Symbol in der Adressleiste oder „Vollbild“-Schaltfläche im Spiel.

## Hosting über HTTPS & Offline-Fähigkeit

Für Service Worker und PWA-Installation wird eine **HTTPS-Verbindung** benötigt (Ausnahme: `localhost` beim lokalen Testen):
- **Build erstellen:** `npm run build` erzeugt das statische Verzeichnis `dist/`.
- **Statisches Hosting:** Den Ordner `dist/` auf einen beliebigen HTTPS-Webspace (z. B. Netlify, GitHub Pages, Cloudflare Pages, eigener Webserver oder Fritz!Box-NAS mit lokalem Zertifikat) hochladen.
- **Keine Laufzeit-Abhängigkeiten:** Es werden keinerlei CDNs, externe Schriften, Analytics oder Cloud-APIs verwendet. Nach dem ersten Laden läuft die App dauerhaft offline.

## Update-Verhalten des Service Workers

- Der Service Worker (`public/sw.js`) speichert alle App-Dateien lokal für den Offline-Start zwischen.
- Bei einem neuen Deployment mit aktualisiertem Cache-Namen lädt der Browser die neuen Dateien im Hintergrund herunter (`skipWaiting` / `clients.claim`) und bereinigt alte Caches beim Aktivieren.
- Um auf einem Tablet sofort sicher die neueste Version zu erzwingen: einmal bei bestehender Internetverbindung neu laden (oder im Browser-App-Speicher den Cache leeren – die Lerndaten in IndexedDB bleiben dabei erhalten!).

## Datensicherung & Datenschutz

- **Nur lokal (IndexedDB):** Spielstand, gelernte Handschrift-Vorlagen (max. 20 je Ziffer) und Lernbeobachtungen liegen ausschließlich in der lokalen IndexedDB des Browsers.
- **Export / Import:** Im **Elternbereich** (auf der Karte „Eltern (3 Sek. halten)“) unter **„Daten & Handschrift“** lässt sich der komplette Spielstand inklusive Handschrift-Vorlagen jederzeit als JSON-Datei herunterladen (`Backup exportieren`) und auf einem neuen Tablet wieder einspielen (`Backup einspielen`).
- **Eltern-PIN:** Beim ersten Besuch des Elternbereichs legen Sie eine 4-stellige PIN fest. Falls die PIN vergessen wurde, hilft eine Erwachsenen-Rechenaufgabe beim Entsperren.
