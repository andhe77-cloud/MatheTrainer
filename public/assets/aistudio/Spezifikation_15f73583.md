# Spezifikation: Mathe-Lernspiel für die 2. Klasse (Arbeitstitel „Klötzchen-Abenteuer“)

Version 0.1 · Sprache der App: Deutsch · Lehrplanbezug: LehrplanPLUS Bayern, Jahrgangsstufe 2, Zahlenraum bis 100

---

## 1. Ziel und Rahmen

**Ziel.** Ein Kind der 2. Klasse übt den Zahlenraum bis 100 (Hunderterfeld/Hundertertafel, Zahlenstrahl, Zehnerübergang, einfaches Plus/Minus, Zahlenmauer) und **schreibt alle Antworten selbst mit Finger, Stift oder Maus**. Das Spiel ist so gut gemacht, dass das Kind es freiwillig weiterspielt, geht sanft mit Fehlern um und **erkennt wiederkehrende Fehlermuster**, auf die es gezielt reagiert und die es den Eltern verständlich meldet.

**Nicht-Ziele (Version 1).** Keine Online-Funktionen, keine Konten, keine Bestenlisten oder Vergleiche mit anderen Kindern, kein Echtgeld, keine Werbung, kein Tracking.

**Nutzer.** Genau ein Kind (ein Profil) plus ein Elternbereich. Zielgerät: Android-Tablet (Hauptziel), Android-Smartphone, Desktop-Browser mit Maus.

**Wichtige Designentscheidungen (kurz).**
1. Antworten werden handschriftlich in Ziffernkästchen eingegeben, die Erkennung läuft lokal, bei Unsicherheit gibt es eine Rückfrage.
2. Ein Tier hüpft die Lösung ab. Das ist zugleich Prüfung, Erklärung und Belohnung.
3. Fehler kosten Herzen, aber nie Besitz und nie den Spielfortschritt. Man kann immer weiterspielen.
4. Belohnungen: Münzen, Truhen, eine selbst gebaute Hub-Welt und ein Sammelalbum, ohne Druck, ohne Konkurrenz.
5. Jede Antwort wird gegen ein **Fehlermodell** geprüft, das typische Kinderfehler vorhersagt. So entsteht die Fehlerdiagnose.

---

## 2. Pädagogische Grundlage

### 2.1 Inhalte (Version 1)
| Welt | Inhalt | Lehrplanbezug (sinngemäß) |
|---|---|---|
| 1 Bauplatte | Hunderterfeld / Hundertertafel: Nachbarfelder, Wege, Zeilen/Spalten, Lücken | Orientierung im Zahlenraum 100, Struktur des Zehnersystems |
| 2 Brückental | Zahlenstrahl: Zahl ↔ Strich, Teilstrecken (z. B. 10–20), Schrittweiten 1/2/5/10 | Zahlen am Zahlenstrahl lesen und einordnen |
| 3 Zehnerschlucht | Zehnerübergang, Ergänzen zum nächsten Zehner, Ergänzen bis 100, Zerlegen | Rechenstrategien, schrittweises Rechnen |
| 4 Rechenwerkstatt | Plus/Minus bis 100, Tausch-/Umkehr-/Nachbaraufgaben, Verdoppeln/Halbieren | Rechenstrategien und Rechenwege |
| 5 Mauerburg | Zahlenmauern (3 und 4 Stockwerke), fehlende Steine an beliebiger Stelle | Muster und Strukturen, Zahlenmauern |

Alle Inhalte sind über **Konfigurationsdateien** (Parametertabellen) steuerbar, damit Andre den Stoff später verfeinern kann (siehe 11).

### 2.2 Didaktische Prinzipien
- **Handschrift als Kern.** Das Kind schreibt Zehner und Einer in getrennte, farblich unterschiedene Kästchen (Zehner blau, Einer rot, durchgängig in der ganzen App). Das stützt das Stellenwertverständnis.
- **Zahlendreher gezielt beachten.** Im Deutschen spricht man „vierundachtzig“ (Einer zuerst). Das Tier spricht beim Landen die Zahl (Sprachausgabe de-DE, mit Text als Rückfall) und zeigt dabei die Zehner/Einer-Zerlegung (80 + 4).
- **Anschauung vor Abstraktion.** Jede Aufgabe hat eine visuelle Hilfe, die auf Wunsch (Hilfe-Knopf) oder nach Fehlern erscheint.
- **Erfolgsquote steuern.** Ziel sind etwa 75–85 % richtige Antworten (Flow). Die Schwierigkeit passt sich an (siehe 7.4).
- **Wenig Lesen.** Zweitklässler lesen noch unsicher: kurze Sätze, Symbole, Vorlesen-Knopf an jeder Aufgabe, Aufgabenstellung wird beim Start automatisch (abschaltbar) vorgelesen.
- **Keine Etiketten.** Die App stellt keine Diagnose („Rechenschwäche“ o. ä.), sondern beschreibt Beobachtungen und gibt Übungsideen.

---

## 3. Spielstruktur

### 3.1 Ablauf
```
Start → Tier begrüßt → Hauptkarte (5 Welten, Hub-Insel, Album, Shop)
        ↓
   Welt wählen (oder „Tagesabenteuer“ vom Tier empfohlen)
        ↓
   Level (8 Aufgaben) → Truhe → Münzen/Sammelitem → Hub-Insel bauen
```
- **Level** = 8 Aufgaben (+ 1 Bonusaufgabe bei mindestens 6 richtigen). Pro Welt 8 Level mit steigender Schwierigkeit.
- **Freie Wahl.** Alle bisher freigeschalteten Welten sind jederzeit wählbar (Autonomie). Das nächste Level einer Welt schaltet sich durch **Abschließen** des vorherigen frei, nicht durch Perfektion.
- **Tagesabenteuer** = 3 Level, vom Tier aus den Welten gemischt: ca. 60 % aktueller Stand, 25 % Wiederholung aktiver Fehlermuster, 15 % leichte Sicherungsaufgaben. Danach gibt es eine Bonustruhe. Weiterspielen ist möglich.
- **Sterne pro Level (1–3)**: 1 Stern = Level geschafft, 2 = höchstens 2 Fehler, 3 = höchstens 1 Fehler und ohne Hilfe. Sterne beeinflussen nur die Truhenqualität, sie sperren nichts.

### 3.2 Welten und Aufgabentypen (Details in Abschnitt 4)
Jeder Aufgabentyp besitzt: Generator, Prüffunktion, Fehlermodell, Hilfe-Animation, Schwierigkeitsstufen 1–5.

---

## 4. Aufgabentypen

### 4.1 Hundertertafel / Hunderterfeld (Welt 1)
**Darstellung.** Standard ist die **Hundertertafel** als Bauplatte (10×10, Zahlen 1–100, Zeile 1 = 1–10, Zeile 10 = 91–100). Zeilen- und Spaltenkopf sind mit Ziffern 1–10 beschriftet. Zusätzlich gibt es die **Punktansicht** (Hunderterfeld mit Fünfer-/Zehnerstruktur) als Hilfe und für einzelne Aufgaben. Beginn der Tafel bei 1 ist Standard und in der Konfiguration umstellbar (0–99).

| Typ | Beispiel | Eingabe |
|---|---|---|
| Nachbarfelder (4er) | „Welche Zahlen liegen um die 84 (oben, unten, links, rechts)?“ | 4 Kästchenpaare, Reihenfolge nach Pfeilen vorgegeben |
| Umgebung (8er) | „Alle Nachbarn der 84“ | 8 Felder, ab Stufe 4 |
| Weg | „Starte bei 36. 2 nach oben, 4 nach rechts. Wo landest du?“ | 1 Zahl |
| Zeile/Spalte | „Welche Zahl steht in der 3. Zeile, 7. Spalte?“ und umgekehrt | 1 Zahl / 2 Ziffern |
| Lücken | Tafelausschnitt mit leeren Feldern ausfüllen | mehrere Zahlen |
| Zahl finden | „Tippe 57“, danach Nachbarn schreiben | Tippen + Schreiben |

Zählrichtung ist immer: Zeilen von oben nach unten, Spalten von links nach rechts. Das steht im Tiertext der ersten Level.

### 4.2 Zahlenstrahl (Welt 2)
Brücke oder Gleis mit Strichen (Brettern). Abschnitte: 0–100, 0–20, 10–20, 40–60, 70–100 usw. Schrittweiten: 1, 2, 5, 10.

| Typ | Beispiel | Eingabe |
|---|---|---|
| Strich → Zahl | Pfeil zeigt auf einen Strich | 1–2 Ziffern |
| Zahl → Strich | „Wo liegt die 47?“ | Tippen auf den Strich, danach Zahl schreiben zur Bestätigung |
| Strich zählen | „Von 10 aus 3 Striche nach rechts. Welche Zahl?“ | Zahl |
| Lücken | Mehrere Striche ohne Beschriftung | mehrere Zahlen |
| Zwischenzahl | „Welche Zahl liegt zwischen 40 und 50, in der Mitte?“ | Zahl |

> **Offener Punkt O1 (Zählweise).** Bei „der 3. Strich nach der 10“ ist offen, ob der Startstrich mitzählt. Standardregel dieser Version: **Der Startstrich zählt nicht mit** („3 Striche nach rechts von der 10“ = 13 bei Schrittweite 1). Die App formuliert deshalb immer „3 Striche nach rechts“ statt „3. Strich“. Andre prüft die Schulbuch-Wortwahl; die Regel ist in der Konfiguration umstellbar (`strichZaehlung: "start_zaehlt_nicht" | "start_ist_erster"`).

### 4.3 Zehnerübergang (Welt 3)
- Ergänzen zum nächsten Zehner („47 + __ = 50“).
- Zehnerübergang in Schritten: 47 + 6 → Zahlenstrahl-Hüpfer „erst bis 50, dann noch 3“. Das Kind schreibt Zwischenschritt(e) und Ergebnis.
- Minus mit Übergang: 83 − 7 („erst bis 80, dann noch 4“).
- Ergänzen bis 100 („38 + __ = 100“).
- Zerlegen: „47 = 40 + __“, „47 = 30 + __“.
Hilfe-Animation: Das Tier hüpft in zwei Sprüngen und markiert den Zehner.

### 4.4 Einfaches Rechnen (Welt 4)
Plus/Minus im Zahlenraum 100 in Stufen: (1) volle Zehner ± Einer ohne Übergang, (2) Zehner ± Zehner, (3) mit Zehnerübergang, (4) Nachbar-/Tausch-/Umkehraufgaben, (5) Verdoppeln/Halbieren, Aufgabenfamilien. Kein Multiplizieren/Dividieren in Version 1 (später ergänzbar).

### 4.5 Zahlenmauer (Welt 5)
Mauer aus Steinen (Klötzchen). Obere Zahl = Summe der beiden darunter. Stufen: 3 Stockwerke bis 20 → 3 Stockwerke bis 100 → 4 Stockwerke. Fehlende Steine an beliebiger Position (unten, Mitte, oben), dadurch auch Subtraktion. Eingabe: Tippen auf einen leeren Stein öffnet das Schreibfeld darunter, „Fertig“ trägt die Zahl ein.

### 4.6 Anforderung an Generatoren
- Deterministisch per Seed, Parameter aus Konfigurationsdatei (Zahlenbereich, Schrittweite, mit/ohne Übergang usw.).
- Keine doppelte Aufgabe innerhalb eines Levels, keine Aufgabe mit mehrdeutiger Lösung.
- Jede Aufgabe trägt Metadaten: `skill` (z. B. `h100.nachbar.rechts`), `level`, `schwierigkeit`, `erwartet`, `fehlermodell`.

---

## 5. Eingabe per Handschrift

### 5.1 Kästchen
- Pro Ziffer ein Kästchen, mindestens 96 × 120 dp, Grundlinie und Mittellinie als dezente Hilfslinien.
- Bei Zahlen bis 99: zwei Kästchen (Zehner blau, Einer rot). Bei Aufgaben mit 100: drei Kästchen. Ein leeres Zehnerkästchen bedeutet einstellige Zahl.
- Bedienung: Stift, Finger oder Maus (Pointer Events). Handballen-Ablehnung: Wenn ein Stift benutzt wird, werden große Touch-Kontakte ignoriert. `touch-action: none` auf der Schreibfläche, kein Scrollen und kein Zoomen beim Schreiben.
- Radieren: Papierkorb pro Kästchen, „Rückgängig“ für den letzten Strich. Kein Zeitdruck.
- Abgabe nur über den **„Fertig“-Knopf** (pulsiert, wenn Kästchen gefüllt sind). Keine automatische Abgabe.
- Linkshänder-Modus (Knopf-Positionen spiegeln) in den Einstellungen.

### 5.2 Erkennung (lokal, offline)
Die Rohdaten sind **Strichfolgen** (Punkte mit Zeit), nicht nur ein Bild. Das erlaubt robuste Erkennung.

Empfohlener Ansatz (der Generator darf begründet abweichen):
1. Normalisieren (Skalierung, Verschiebung), Umpunkten auf feste Punktzahl pro Strich, Strichzahl und Reihenfolge als Merkmale.
2. Vergleich mit **Vorlagen** je Ziffer (mehrere Schreibvarianten: 1 mit/ohne Fähnchen, 7 mit/ohne Querstrich, 4 offen/geschlossen, 2 mit Schleife/ohne usw.).
3. **Lernende Vorlagen:** In einem kurzen „Schreibtraining“ beim ersten Start schreibt das Kind jede Ziffer 2-mal. Bestätigte Eingaben aus dem Spiel kommen als weitere Vorlagen dazu (max. 20 pro Ziffer, älteste fallen heraus).
4. Optional zusätzlich ein kleines lokales neuronales Netz (28×28-Bild), falls es ohne Netzzugriff zur Laufzeit eingebunden werden kann. Ergebnis: Kombination der Scores.

**Ausgabe:** Rangliste der Ziffern mit Wahrscheinlichkeiten, plus Flags (`gespiegelt`, `unleserlich`).

### 5.3 Entscheidungslogik (wichtig)
Die Erkennung darf **niemals** eine falsche Antwort „wohlwollend“ in eine richtige umdeuten.
- Eindeutig (Top-1 deutlich vor Platz 2): Ziffer wird übernommen, egal ob sie zur Lösung passt.
- Unsicher (Abstand klein oder Top-2 liegen in einer bekannten Verwechslungsgruppe): **Rückfrage**: Das Tier fragt „Meinst du eine 7 oder eine 1?“ Zwei große Knöpfe, daneben das Bild der eigenen Schrift. Die Auswahl wird als Lernbeispiel gespeichert.
- Unleserlich: „Schreib die Zahl noch mal, ich konnte sie nicht lesen.“ Kein Herzverlust, kein Fehler in der Statistik.
- Bekannte Verwechslungsgruppen: 1/7, 4/9, 0/6, 5/6, 2/Z-Form, 3/8.
- **Gespiegelte Ziffern** (bei Kindern dieses Alters häufig) werden als die gemeinte Ziffer gewertet (mathematisch richtig). Das Tier sagt freundlich „Die 3 schaut andersrum, probier sie mal so“ (zeigt Vorlage). Das fließt als Schreibhinweis in die Statistik, nicht als Rechenfehler.
- Schwellenwerte (`tau_eindeutig`, `tau_rueckfrage`) stehen in der Konfiguration. Ein Testmodus im Elternbereich zeigt Erkennungsergebnisse live und erlaubt, Beispiele zu sammeln.

### 5.4 Messbare Anforderungen
- Erkennung pro Ziffer < 50 ms.
- In der Testsuite (synthetisch verrauschte Vorlagen plus gesammelte Beispiele) ≥ 95 % korrekt bei Auto-Annahme, Rückfragequote ≤ 15 %, **Falschannahme (stille Fehlerkennung) ≤ 1 %**.
- Ein Werkzeug „Beispiele sammeln/exportieren“ (JSON) ist Teil der App (nur im Elternbereich).

---

## 6. Prüfung durch das Tier („Hüpfer“)

Das Tier (zum Start auswählbar: Fuchs, Axolotl oder Hase, vom Kind benannt) ist Spielfigur, Erklärer und Maskottchen.

### 6.1 Bei richtiger Antwort
Das Tier hüpft vom Startfeld Schritt für Schritt zum Ziel (Hundertertafel: Feld für Feld oder in Zehnersprüngen, Zahlenstrahl: von Strich zu Strich). Jedes Feld leuchtet auf, die Hüpftöne steigen in der Tonleiter. Zielfeld: Landung, Konfetti, Zahl wird gesprochen („vierundachtzig“) und als 80 + 4 gezeigt.

### 6.2 Bei falscher Antwort
1. Das Tier hüpft zur **vom Kind genannten Zahl**, bleibt stehen und macht „Hm?“. Ruhige Animation, kein Fehlerton, keine rote Farbe (warme orange/gelbe Töne).
2. Herz verliert sich (siehe 7.1).
3. Hilfestufe (6.3).

### 6.3 Hilfestufen pro Aufgabe
| Versuch | Hilfe |
|---|---|
| 1. Fehler | Kurzer, **zur Fehlerkategorie passender** Hinweis vom Tier („Nach unten sind es immer 10 mehr“), Kind darf neu schreiben |
| 2. Fehler | Das Tier hüpft den richtigen Weg vor, Kind darf noch einmal schreiben |
| 3. Fehler | Lösung wird gezeigt, das Kind **schreibt die Zahl ab** (Münzen gibt es trotzdem). Die Aufgabe kommt 3–5 Aufgaben später in leicht veränderter Form wieder |

Die Hüpfdauer ist begrenzt (max. ca. 3 s, lange Wege hüpfen schneller). Überspringen per Tippen.

### 6.4 Sprachausgabe und Töne
- Zahlwörter werden aus der Zahl generiert (Regel-basiert, kein Zahlwort-Lexikon nötig), per `speechSynthesis` (de-DE) wenn verfügbar, sonst nur Text.
- Alle Töne per WebAudio erzeugt oder als sehr kleine eingebettete Dateien. Musik und Effekte getrennt abschaltbar.

---

## 7. Motivation, Leben und Belohnung

### 7.1 Herzen („sanftes Leben“)
- 3 Herzen pro Level. Jede falsche Antwort kostet **höchstens ein Herz pro Aufgabe**.
- Bei 0 Herzen: kein Game Over. Das Tier ist „müde“ und schaltet in den **Entdecker-Modus**: Hilfen sind automatisch an, das Level kann abgeschlossen werden (1 Stern, reduzierte Münzen, aber immer mindestens 1 Münze pro Aufgabe). Alternativ „Level neu starten“ (ohne Strafe).
- Herzen füllen sich bei jedem neuen Level wieder auf.
- **Nie** werden Münzen, Items oder Fortschritt abgezogen.

### 7.2 Münzen, Truhen, Shop, Hub-Welt, Album
**Münzen** („Goldklötzchen“): 3 pro Aufgabe im ersten Versuch, 2 nach Hilfe 1, 1 danach. Level-Bonus: +5 (+ Sterne). Anstrengung wird immer belohnt, nicht nur Perfektion.

**Truhen** (Holz/Eisen/Gold nach Sternen) am Levelende:
- Öffnen-Animation mit Spannungsaufbau (2–3 s, ab dem 2. Mal überspringbar).
- Inhalt: Münzen + **ein Sammelitem** aus einer aktiven Serie.
- Schutz vor Frust: **Doppelte Items kommen erst, wenn die Serie komplett ist**. Die Serie mit Fortschritt („6/10“) ist vorab sichtbar.
- Truhen sind weder kaufbar noch durch Echtgeld oder Zeitangebote erhältlich.

**Shop** (Münzen gegen Items, **feste sichtbare Preise**, keine Zufallskäufe):
- Hub-Bauelemente: Blöcke (Gras, Stein, Holz, Sand, Glas, Farbsteine), Pflanzen, Tiere, Gebäudeteile (Türen, Fenster, Dächer, Türme, Brücken), Fahrzeuge (Lore, Zug, Auto), Deko (Fahnen, Fackeln, Schatzkisten), Spezialeffekte (Regenbogen, Feuerwerk).
- **Tier-Anpassung:** Hüte, Umhänge, Rucksäcke, Hüpf-Effekte (Sterne, Herzen, Blumen, Funken), Hüpf-Sounds. Das koppelt die Kern-Mechanik (Hüpfer) an Sammelwünsche.
- Preise so, dass ein kleines Item nach 1–2 Level erreichbar ist, mittlere nach 2–3 Spieltagen, große Items nach etwa 1–2 Wochen.
- **Wunschzettel:** Das Kind markiert ein Wunsch-Item; ein Fortschrittsbalken zeigt, wie nah es ist (Zielgradient).

**Hub-Insel** („Bauplatz“): freier Bauplatz im 2.5D-Klötzchenstil (Raster), Items per Ziehen platzieren, drehen, entfernen, Insel-Ausschnitt scrollbar. Das Tier wohnt dort, hüpft herum und reagiert auf Tippen. Kein Verlust, nichts „verfällt“.

**Sammelalbum:** Serien à 8–12 Einträge (z. B. Dschungel, Burg, Weltraum, Piraten, Stadt). Jeder Eintrag: Titel, Bild und **ein kurzer Wissenssatz** (spielerisch, kindgerecht). Das Album ist optional und verschafft keinen Spielvorteil.

### 7.3 Dranbleiben ohne Druck (Leitlinien)
Quellenlage (Abschnitt 13): Belohnungen funktionieren am besten, wenn sie **Informationen über den Fortschritt** und **Sammeln/Entdecken** bieten, nicht als Druckmittel; Wettbewerb zwischen Kindern kann die innere Motivation schwächen; Feedback am Rundenende wird von Kindern deutlich besser wahrgenommen als Anzeigen während des Spielens.

Umsetzung:
- **Rundenende ist die Bühne:** Während der Aufgaben bleibt die Oberfläche ruhig (nur Herzen, Fortschritt „Aufgabe 4/8“). Münzen, Sterne, Truhe, Album, Wunschzettel erscheinen am Levelende.
- **Kein Wettbewerb:** keine Ranglisten, keine „besser als andere“. Rekord nur gegen sich selbst („Dein bester Lauf“).
- **Autonomie:** freie Weltwahl, freie Gestaltung der Insel, Tier benennen und ausstatten.
- **Kompetenzerleben:** Lob für Vorgehen und Fortschritt („Du hast den Zehner geschafft!“), sichtbarer Lernfortschritt („Du kennst jetzt 8 von 10 Nachbarn sicher“).
- **Sanftes Dranbleiben statt Dunkler Muster:** keine Streak-Strafen (der „Fleißbaum“ wächst an Spieltagen, Pausentage nehmen nichts weg), keine Zeitlimit-Angebote, kein „Noch 1 Level, sonst verlierst du …“.
- **Natürliche Pausen:** Nach 15 Minuten (einstellbar, Standard) gähnt das Tier und schlägt eine Pause vor, Spielstand wird gespeichert. Eltern können eine harte Tageszeit festlegen.
- **Abwechslung:** Level-Dramaturgie (leichter Start, Höhepunkt Level 6–7, Bonusaufgabe), kleine Überraschungen (Tier-Animationen, versteckte Items auf der Insel).

### 7.4 Adaptive Schwierigkeit
- Pro `skill` ein Meisterungsmaß 0–1 (gleitender Durchschnitt aus Richtigkeit, Hilfenutzung und Zeit).
- 3 richtige Aufgaben in Folge ohne Hilfe → Stufe +1 innerhalb des Levels (nicht über die Levelgrenze hinaus). 2 Fehler in Folge → Stufe −1 und einfachere Hilfe.
- Wiederholung nach Abstand (1, 3, 7 Tage) für Fähigkeiten, die zuletzt Fehler hatten.

---

## 8. Fehlerdiagnose (wiederkehrende Fehler erkennen)

### 8.1 Prinzip: das Fehlermodell
Zu jeder Aufgabe berechnet das Spiel **die Antworten, die typische Fehler ergeben würden**. Nach der Eingabe wird die Antwort des Kindes mit dieser Liste abgeglichen:
```
fehlermodell(aufgabe) → [ {kategorie: "H4_plus1_vs_plus10", antwort: 85}, {kategorie: "H7_zahlendreher", antwort: 48}, ... ]
```
Eine falsche Antwort kann zu mehreren Kategorien passen (Gewicht 1/n pro Kategorie). Passt keine Kategorie, wird sie als `X0_unklar` gezählt.

### 8.2 Fehlerkategorien (Startliste, erweiterbar)
**Hundertertafel**
- `H1` Oben/unten vertauscht · `H2` links/rechts vertauscht
- `H3` Zeile und Spalte verwechselt („3. Zeile“ als 3. Spalte gelesen)
- `H4` ±1 und ±10 vertauscht (rechts = +1, unten = +10)
- `H5` Zeilenumbruch am Rand (20 → 21 liegt nicht rechts, sondern links in der nächsten Zeile)
- `H6` Startfeld mitgezählt (um 1 daneben)
- `H7` Zahlendreher (84 ↔ 48)

**Zahlenstrahl**
- `Z1` Startstrich mitgezählt (Off-by-one) · `Z2` Schrittweite falsch gelesen (2er/5er als 1er)
- `Z3` Richtung falsch · `Z4` Beschriftung statt Strich gelesen · `Z5` Zahlendreher

**Zehnerübergang / Rechnen**
- `R1` Zehnerübergang ausgelassen (47 + 6 = 43 bzw. 413) · `R2` Zehner statt Einer verändert
- `R3` Rechenzeichen vertauscht · `R4` nur bis zum Zehner gerechnet, Rest vergessen
- `R5` „kleine minus große Zahl“ umgedreht (52 − 8 → 8 − 2 = 6) · `R6` Ergebnis genau um 10 daneben
- `R7` um 1 daneben (Zählfehler)

**Zahlenmauer**
- `M1` Mauer von oben nach unten falsch (statt Subtraktion addiert) · `M2` nur einen Nachbarn übernommen
- `M3` Grundrechenfehler im Zahlenraum bis 20

**Schreiben/Eingabe (nicht als Rechenfehler zählen)**
- `S1` gespiegelte Ziffer · `S2` Ziffer in falsches Kästchen (Einer im Zehnerkästchen) · `S3` häufige Rückfragen bei bestimmten Ziffern

### 8.3 Erkennen von Mustern
- Pro Kategorie wird ein Zähler über die letzten 20 Aufgaben des betroffenen `skill` geführt.
- **Aktives Muster**, wenn Kategorie ≥ 3-mal in den letzten 12 Aufgaben ODER ≥ 25 % der letzten 20. Es endet nach 8 Aufgaben in Folge ohne diesen Fehler.
- **Reaktion im Spiel:** Das Tier lädt zur **Übungsinsel** ein (kurzer Erklärmoment: 3 geführte Beispiele mit Animation, danach 4 gezielte Aufgaben). Münzen wie gewohnt, kein Zwang, aber das Tagesabenteuer enthält ein Wiederholungsstück zu aktiven Mustern.
- **Reaktion für Eltern:** Eintrag im Dashboard (siehe 9), kein Alarmton.

### 8.4 Hinweistexte (Beispiele)
| Kategorie | Hinweis im Spiel (Tier) | Empfehlung für Eltern |
|---|---|---|
| H4 | „Nach rechts +1, nach unten +10. Schau dir das Feld an!“ | Auf der Hundertertafel am Küchentisch „1 weiter, 10 runter“ mit dem Finger zeigen lassen. |
| H5 | „Am Rand geht’s unten links weiter!“ | Zahlenreihe 18, 19, 20, 21 laut zählen und Finger auf der Tafel mitführen. |
| H7 | „Vier-und-achtzig: hör auf die Zehner zuerst: 8 Zehner, 4 Einer.“ | Zahlen mit Zehnerstangen/Einerwürfeln (z. B. LEGO) legen und dazu aufschreiben. |
| Z1 | „Die 10 ist der Start. Gezählt wird ab dem nächsten Strich.“ | Auf einem gemalten Zahlenstrahl mit Stift hüpfen, Hüpfer zählen, nicht Striche. |
| R1 | „Erst bis zum nächsten Zehner, dann den Rest.“ | 47 + 6 am Zahlenstrahl: „Wie viel bis zur 50?“ als Alltagsfrage (Treppen, Stufen). |
| M1 | „Die obere Zahl ist die Summe der beiden darunter.“ | Mauer mit Bausteinen legen, oberen Stein auf zwei untere stapeln. |
Alle weiteren Kategorien bekommen Texte im gleichen Stil (kurz, positiv, konkret, keine Fachbegriffe wie „Dyskalkulie“).

### 8.5 Protokoll (pro Aufgabe lokal gespeichert)
`zeit`, `welt`, `level`, `skill`, `parameter`, `erwartet`, `eingabe`, `erkennungs-konfidenz`, `rueckfrage (ja/nein)`, `fehlerkategorien[]`, `hilfestufe`, `dauer_bis_erster_strich`, `dauer_gesamt`, `versuche`, `tier_hilfe_genutzt`.
Wichtig: Erkennungsprobleme (S3) und Rechenfehler getrennt halten.

---

## 9. Elternbereich

Zugang über **PIN** (4 Ziffern, Erstkonfiguration beim ersten Start; Wiederherstellung per Erwachsenen-Rechenaufgabe), erreichbar über versteckte Schaltfläche (3 Sekunden lang drücken).

**Dashboard**
- Spielzeit pro Tag/Woche, Anzahl Aufgaben, Trefferquote pro Welt/`skill`, Verlauf (Linien-/Balkendiagramm, einfach).
- **„Auffälligkeiten“**: aktive Fehlermuster in Alltagssprache mit Beispiel aus den letzten Aufgaben und **konkreter Empfehlung** (Tabelle 8.4), plus Hinweis „Wenn das über mehrere Wochen bleibt, sprecht mit der Lehrkraft.“
- **„Das klappt schon gut“**: Fähigkeiten mit hoher Meisterung (positiver Fokus zuerst).
- **Schreib-Statistik**: Rückfragen pro Ziffer, gespiegelte Ziffern.
- Zahlen als kopierbarer Text („Wochenbericht“) und als JSON-Export.

**Einstellungen:** Zahlenraum und Aufgabentypen ein/aus, Zehnerübergang an/aus, Schwierigkeit (Auto/fest), Striche-Zählregel (O1), Tafelbeginn (1 oder 0), Spielzeit-Hinweis (Minuten) und harte Tagesgrenze, Vorlesen, Musik/Effekte, Linkshänder, Handschrift-Testmodus, Schreibtraining neu starten, **Sicherung/Wiederherstellung** (Datei), Spielstand zurücksetzen (mit Bestätigung).

---

## 10. Grafik, Ton und Bedienung

### 10.1 Stil
- **Eigener Klötzchen-Look**: Voxel-/Block-Optik und Steckstein-Anmutung (abgerundete Würfel, Noppen) in leuchtenden, warmen Farben. **Keine geschützten Marken, Figuren, Logos, Texturen oder Namen** (weder Minecraft noch LEGO). Eigenständig gezeichnete Assets (SVG/Canvas), erkennbar „klötzchenhaft“.
- Tiere als niedliche Klötzchenfiguren mit mehreren Animationszuständen: Idle, Hüpfen (Squash & Stretch), Freude, Nachdenken („Hm?“), Müdigkeit, Gähnen, Kopfnicken.
- Zahlen in einer gut lesbaren, runden, schulnahen Schrift (nur systemlokal oder eingebettet, keine Fremdlieferung zur Laufzeit). Ziffern 1, 4, 7 eindeutig unterscheidbar.
- Hoher Kontrast, Farbblindheits-sichere Paarung für Zehner (blau) und Einer (rot): zusätzlich über Form/Position unterscheidbar.

### 10.2 Animation und Performance
- 60 fps auf einem Mittelklasse-Android-Tablet, Animationen mit Canvas/CSS/SVG. Modus „Weniger Bewegung“.
- Kein Layout-Springen, Übergänge 150–300 ms, Hüpfer mit Bogen, Schatten, Staubpartikel.

### 10.3 Layout
- Querformat bevorzugt (Tablet), Hochformat unterstützt. Touch-Ziele ≥ 64 dp.
- Hauptkarte: Weltenkarte mit 5 Welten, Hub-Insel, Album, Shop, Tier. Kein Menüchaos: maximal 5 Hauptsymbole.
- Im Level: Aufgabe oben (Text + Symbol + Vorlesen), Visualisierung in der Mitte, Schreibkästchen unten, „Fertig“ rechts unten.

### 10.4 Sprache
Kurze Sätze, du-Form, Tier als Sprecher. Pro Situation mindestens 5 Varianten (Lob, Trost, Hinweise, Begrüßung). Nie „falsch“, „Fehler“, „schlecht“. Stattdessen „Fast!“, „Schau mal“, „Probier’s noch mal“. Alle Texte in einer Datei `strings.de.js` (später übersetzbar).

---

## 11. Erweiterbarkeit („verfeinern und fortlaufend anpassen“)
- Aufgabentypen, Zahlenbereiche und Level-Parameter als **Daten** (JSON/JS-Konfiguration), nicht fest im Code.
- Neue Aufgabentypen als Modul: `generator`, `pruefer`, `fehlermodell`, `visualisierung`, `hilfe`, `skills`.
- Fehlerkategorien und Hinweistexte in Tabellen.
- Platzhalter für spätere Inhalte: Multiplikation (kleines Einmaleins), Geld, Uhrzeit, Stellenwerttafel, Schätzen, Sachaufgaben.

---

## 12. Technik

- **Webanwendung (HTML/CSS/JS), installierbar als PWA** auf Android: `manifest.webmanifest` mit `display: "fullscreen"`, Icons 192/512 (maskable), `start_url`, Farben. **Service Worker** mit Cache-First (komplett offline spielbar nach der ersten Installation).
- **Hosting-Hinweis:** Installation und Service Worker brauchen **HTTPS** (oder `localhost`). Andre benötigt dafür einen einfachen statischen Host (z. B. GitHub Pages, Netlify, eigener Webspace). Die App besteht nur aus statischen Dateien.
- **Keine Laufzeit-Abhängigkeit zum Internet:** keine CDNs, keine externen Schriften, keine Analyse-Skripte. Eigene Bibliotheken werden eingebettet (gebündelt) und mit Version vermerkt.
- **Keine Build-Pflicht** wünschenswert (ES-Module, direkt auslieferbar). Falls ein Bundler gebraucht wird, muss das fertige Ergebnis als Ordner `dist/` abgelegt werden.
- **Speicher:** IndexedDB (Spielstand, Protokoll, Handschriftvorlagen), `navigator.storage.persist()` anfragen, Export/Import als JSON. Schema-Versionierung und Migrationen.
- **Struktur (Vorschlag):**
  ```
  /index.html, /manifest.webmanifest, /sw.js, /icons
  /src/core      (Zustand, Zufall mit Seed, Speicher, Ereignisse)
  /src/tasks     (je Aufgabentyp: generator, pruefer, fehlermodell, hilfe)
  /src/input     (Schreibkästchen, Strich-Erfassung, Erkennung, Rückfrage)
  /src/ui        (Szenen: Karte, Level, Truhe, Hub, Shop, Album, Eltern)
  /src/rewards   (Münzen, Truhen, Items, Serien, Shop-Preise)
  /src/diagnostics (Fehlermodell, Muster, Empfehlungen, Statistik)
  /src/content   (Konfigurationen, strings.de.js, Itemkatalog)
  /tests         (Einheitentests, Erkennungs-Testbett)
  ```
- **Tests (mindestens):** Generatoren (Lösung eindeutig, Bereich korrekt), Prüfer, **Fehlermodell** (jede Kategorie erzeugt erwartete Antwort), Mustererkennung (Schwellen), Belohnungsökonomie (keine negativen Salden), Handschrift-Testbett (Genauigkeit, Falschannahmerate), Speicher/Migration.

---

## 13. Datenschutz und Sicherheit
- Alle Daten bleiben auf dem Gerät. Keine Konten, keine Übertragung, keine Drittanbieter.
- Nutzung durch ein Kind: keine Links nach außen im Kinderbereich, Elternbereich per PIN geschützt.
- Hinweis im Elternbereich: Die Auswertung ersetzt keine fachliche Diagnose.

---

## 14. Abnahmekriterien (Definition of Done für Version 1)
1. Installierbar auf Android (Chrome), startet im Vollbild, funktioniert offline.
2. Alle 5 Welten spielbar mit je 8 Leveln, Generatoren konfigurierbar.
3. Handschrift-Eingabe in Kästchen funktioniert mit Finger, Stift und Maus, Rückfrage bei Unsicherheit, Falschannahme ≤ 1 % im Testbett.
4. Hüpf-Prüfung für alle Aufgabentypen, positives und sanft-korrigierendes Verhalten wie in 6.
5. Herzen, Entdecker-Modus, Münzen, Truhen (mit Doppelschutz), Shop, Hub-Insel mit mindestens 40 Items, Album mit mindestens 3 Serien.
6. Fehlermodell mit allen Kategorien aus 8.2 und Mustererkennung nach 8.3; Übungsinsel für mindestens 6 Kategorien.
7. Elternbereich nach 9 (Dashboard, Auffälligkeiten mit Empfehlungen, Einstellungen, Export).
8. 60 fps (Zielgerät Tablet), keine Abstürze in 30-minütigem Dauertest, Ladezeit nach Installation < 2 s.
9. Kein geschütztes Fremdmaterial, kein Netzwerkzugriff zur Laufzeit.
10. Testsuite läuft grün, `README.md` mit Installations- und Hosting-Anleitung.

**Praxis-Test mit dem Kind (durch Andre, 10 Minuten):** Beobachten, ob das Kind (a) ohne Hilfe startet, (b) die Rückfragen versteht, (c) nach dem Level freiwillig weiterspielt, (d) bei Fehlern ruhig bleibt. Ergebnisse als Anpassungsliste an den Generator zurückgeben.

---

## 15. Offene Punkte (von Andre zu klären, mit Standardannahme)
| Nr. | Frage | Standardannahme |
|---|---|---|
| O1 | Zählt der Startstrich auf dem Zahlenstrahl mit? (siehe 4.2) | Nein |
| O2 | Begriffe in der Schule: „Hunderterfeld“, „Hundertertafel“, „Hunderterfeld“ mit Punkten? | Tafel 1–100, Punktfeld als Hilfe |
| O3 | Zahlenmauer: Aufbau im Schulbuch (Stockwerke, Zahlenraum)? | 3 Stockwerke, bis 20, dann bis 100 |
| O4 | Hosting für die PWA (HTTPS)? | Statischer Host, Andre entscheidet |
| O5 | Zielgerät und Stift? | Android-Tablet, Finger |
| O6 | Tageszeit-Grenze? | 15 Minuten Hinweis, keine harte Grenze |

---

## 16. Quellen (Recherche zu Motivation und Lehrplan)
- Lomos et al. (2023): *The Design of Incentive Systems in Digital Game-Based Learning: How Primary School Children Interact with It*, Education Sciences 13(7), 668. https://www.mdpi.com/2227-7102/13/7/668 (Eye-Tracking bei 8–11-Jährigen: Belohnungsanzeigen im Spiel wurden kaum beachtet, Feedback am Ende deutlich mehr; Wunsch nach Wettbewerb kann innere Motivation mindern).
- Plessis-Ouzariah et al. (2025): *Investigating Pupils’ Motivation with a Reward-Driven Feature in a Game-Based Learning Environment*, ECGBL. https://papers.academic-conferences.org/index.php/ecgbl/article/view/4217 (optionales, truhenartiges Sammelfeature ohne Spielvorteil bei Schweizer Grundschulkindern).
- Zendle, Meyer & Over (2019), zitiert in der ECGBL-Arbeit: Hauptmotive bei Kisten sind Belohnung, Sammlung vervollständigen, Spannung beim Öffnen, Aussehen (Einsatz hier ohne Echtgeld und ohne Zufallskauf).
- LehrplanPLUS Bayern, Mathematik Grundschule: https://www.lehrplanplus.bayern.de/jgs/2/fach/mathematik (Rechenstrategien in ZR 20 und 100, Muster und Strukturen, Zahlenmauern).
- Schulbuch-Inhalte (Beispiel Helbling, Klasse 2): Zahlenraum 100, Hundertertafel, Zahlenstrahl, Nachbarzahlen, Zahlenmauer.
