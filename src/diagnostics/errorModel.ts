import type { ErrorCategoryCode } from '../core/types';

export interface TaskFaultCandidate {
  category: ErrorCategoryCode;
  answer: number | number[];
}

export interface DiagnosticHintEntry {
  category: ErrorCategoryCode;
  title: string;
  tierHinweis: string;
  elternTipp: string;
}

export const DIAGNOSTIC_HINTS: Record<ErrorCategoryCode, DiagnosticHintEntry> = {
  H1_oben_unten: {
    category: 'H1_oben_unten',
    title: 'Oben und unten auf der Tafel vertauscht',
    tierHinweis: 'Schau genau: Nach oben wird die Zahl um 10 kleiner, nach unten um 10 größer!',
    elternTipp: 'Auf einer Hundertertafel gemeinsam mit dem Finger „nach oben = 10 weniger, nach unten = 10 mehr“ abfahren.',
  },
  H2_links_rechts: {
    category: 'H2_links_rechts',
    title: 'Links und rechts vertauscht',
    tierHinweis: 'Nach rechts wird es 1 mehr, nach links 1 weniger!',
    elternTipp: 'Links/rechts beim Zählen laut mitsprechen: „Links eins zurück, rechts eins vor.“',
  },
  H3_zeile_spalte: {
    category: 'H3_zeile_spalte',
    title: 'Zeile und Spalte verwechselt',
    tierHinweis: 'Die Zeile zählt von oben nach unten, die Spalte von links nach rechts!',
    elternTipp: 'Mit dem Finger zuerst die Zeile am linken Rand suchen, dann waagerecht bis zur Spalte fahren.',
  },
  H4_plus1_vs_plus10: {
    category: 'H4_plus1_vs_plus10',
    title: '1er-Schritt und 10er-Schritt verwechselt',
    tierHinweis: 'Nach rechts +1, nach unten +10. Schau dir das Feld genau an!',
    elternTipp: 'Auf der Hundertertafel am Küchentisch „1 weiter, 10 runter“ mit dem Finger zeigen lassen.',
  },
  H5_zeilenumbruch: {
    category: 'H5_zeilenumbruch',
    title: 'Zeilenumbruch am Rand der Tafel',
    tierHinweis: 'Am rechten Rand geht es in der nächsten Zeile ganz links weiter!',
    elternTipp: 'Zahlenreihe 18, 19, 20, 21 laut zählen und den Sprung an den linken Rand mit dem Finger zeigen.',
  },
  H6_startfeld_mitgezaehlt: {
    category: 'H6_startfeld_mitgezaehlt',
    title: 'Startfeld beim Zählen mitgezählt',
    tierHinweis: 'Auf dem Startfeld stehst du schon! Erst beim nächsten Feld zählst du „eins“.',
    elternTipp: 'Beim Hüpfen jeden Schritt erst beim Verlassen des Startfelds zählen („Hüpfer zählen, nicht Felder“).',
  },
  H7_zahlendreher: {
    category: 'H7_zahlendreher',
    title: 'Zehner und Einer vertauscht (Zahlendreher)',
    tierHinweis: 'Hör genau auf die Zehner zuerst: Erst das blaue Zehner-Kästchen, dann die roten Einer!',
    elternTipp: 'Zahlen mit Zehnerstangen und Einerwürfeln legen und immer zuerst die Zehner aufschreiben.',
  },
  Z1_startstrich_mitgezaehlt: {
    category: 'Z1_startstrich_mitgezaehlt',
    title: 'Startstrich am Zahlenstrahl mitgezählt',
    tierHinweis: 'Die Startzahl zählt noch nicht als Sprung. Erst ab dem nächsten Strich zählen!',
    elternTipp: 'Auf einem gemalten Zahlenstrahl mit dem Stift Bögen hüpfen und die Bögen zählen, nicht die Striche.',
  },
  Z2_schrittweite_falsch: {
    category: 'Z2_schrittweite_falsch',
    title: 'Schrittweite am Zahlenstrahl falsch gelesen',
    tierHinweis: 'Schau auf die großen Zahlen! Wie groß ist ein einzelner Sprung zwischen zwei Strichen?',
    elternTipp: 'Gemeinsam 2er-, 5er- und 10er-Schritte laut klatschen und am Zahlenstrahl zeigen.',
  },
  Z3_richtung_falsch: {
    category: 'Z3_richtung_falsch',
    title: 'Richtung auf dem Zahlenstrahl vertauscht',
    tierHinweis: 'Nach rechts werden die Zahlen größer, nach links kleiner!',
    elternTipp: 'Richtungspfeile am Zahlenstrahl gemeinsam benennen: rechts größer, links kleiner.',
  },
  Z4_beschriftung_gelesen: {
    category: 'Z4_beschriftung_gelesen',
    title: 'Nachbar-Beschriftung statt Zielstrich gelesen',
    tierHinweis: 'Schau genau, auf welchen Strich der Pfeil zeigt!',
    elternTipp: 'Mit dem Finger genau entlang der Pfeilspitze bis zum Strich fahren.',
  },
  Z5_zahlendreher: {
    category: 'Z5_zahlendreher',
    title: 'Zahlendreher am Zahlenstrahl',
    tierHinweis: 'Blau sind die Zehner, Rot sind die Einer!',
    elternTipp: 'Die Zahl erst als Zehner + Einer zerlegen (z. B. 40 + 7), dann eintragen.',
  },
  R1_uebergang_ausgelassen: {
    category: 'R1_uebergang_ausgelassen',
    title: 'Zehnerübergang ausgelassen',
    tierHinweis: 'Erst bis zum nächsten Zehner, dann den Rest!',
    elternTipp: 'Aufgaben wie 47 + 6 in zwei Sprüngen üben: „Wie viel fehlt bis 50? Wie viel bleibt übrig?“',
  },
  R2_zehner_statt_einer: {
    category: 'R2_zehner_statt_einer',
    title: 'Zehner statt Einer verändert',
    tierHinweis: 'Achte darauf, ob du Einer oder ganze Zehner dazuzählst!',
    elternTipp: 'Mit blauen Zehnerstangen und roten Einerwürfeln legen, was sich beim Rechnen verändert.',
  },
  R3_rechenzeichen_vertauscht: {
    category: 'R3_rechenzeichen_vertauscht',
    title: 'Plus und Minus verwechselt',
    tierHinweis: 'Schau auf das Rechenzeichen: Plus macht mehr, Minus nimmt weg!',
    elternTipp: 'Vor dem Rechnen das Zeichen (+ oder −) laut vorlesen lassen.',
  },
  R4_rest_vergessen: {
    category: 'R4_rest_vergessen',
    title: 'Nur bis zum Zehner gerechnet, Rest vergessen',
    tierHinweis: 'Du bist schon bis zum Zehner gehüpft – jetzt fehlt nur noch der zweite Sprung!',
    elternTipp: 'Beide Teilsprünge mit den Fingern abzählen und kontrollieren.',
  },
  R5_kleine_minus_grosse: {
    category: 'R5_kleine_minus_grosse',
    title: 'Einer beim Minus falschrum gedreht',
    tierHinweis: 'Wenn die Einer nicht reichen, holst du dir Hilfe vom Zehner!',
    elternTipp: 'Bei z. B. 52 − 8 zuerst − 2 bis 50 und dann − 6 rechnen.',
  },
  R6_um_10_daneben: {
    category: 'R6_um_10_daneben',
    title: 'Ergebnis genau um einen Zehner daneben',
    tierHinweis: 'Zähl noch einmal die blauen Zehner nach!',
    elternTipp: 'Die Zehnerzahl vor dem Schreiben kurz halblaut nennen.',
  },
  R7_um_1_daneben: {
    category: 'R7_um_1_daneben',
    title: 'Um 1 verzählt',
    tierHinweis: 'Fast genau richtig! Zähl noch einen Schritt in Ruhe nach.',
    elternTipp: 'Ohne Zeitdruck Schritt für Schritt prüfen.',
  },
  M1_mauer_falschrum: {
    category: 'M1_mauer_falschrum',
    title: 'Zahlenmauer von oben nach unten addiert statt zerlegt',
    tierHinweis: 'Die obere Zahl ist immer die Summe der beiden Steine darunter!',
    elternTipp: 'Mit Bausteinen eine kleine Mauer legen: Der obere Stein entsteht aus den beiden unteren.',
  },
  M2_nur_ein_nachbar: {
    category: 'M2_nur_ein_nachbar',
    title: 'Nur einen Nachbarstein übernommen',
    tierHinweis: 'Beide Steine darunter gehören zusammen in den oberen Stein!',
    elternTipp: 'Mit beiden Zeigefingern gleichzeitig auf die zwei unteren Steine tippen.',
  },
  M3_grundrechenfehler_20: {
    category: 'M3_grundrechenfehler_20',
    title: 'Kleines Plus/Minus bis 20 unsicher',
    tierHinweis: 'Zerlege die kleine Zahl im Kopf oder schau auf die Punkte!',
    elternTipp: 'Kleine Ergänzungen bis 10 (verliebte Zahlen) spielerisch im Alltag üben.',
  },
  S1_gespiegelt: {
    category: 'S1_gespiegelt',
    title: 'Ziffer gespiegelt geschrieben',
    tierHinweis: 'Die Zahl war richtig gedacht! Nur die Ziffer schaut noch andersrum.',
    elternTipp: 'Kein Rechenfehler – bei Gelegenheit die Schreibrichtung der Ziffer kurz in Groß nachfahren.',
  },
  S2_falsches_kaestchen: {
    category: 'S2_falsches_kaestchen',
    title: 'Einstellige Zahl ins blaue Zehnerkästchen geschrieben',
    tierHinweis: 'Bei einer Zahl bis 9 bleibt das blaue Zehnerkästchen leer – schreib ins rote Einerkästchen!',
    elternTipp: 'Einstellige Zahlen gehören immer ins rote Einer-Haus.',
  },
  S3_haeufige_rueckfrage: {
    category: 'S3_haeufige_rueckfrage',
    title: 'Häufige Rückfragen bei einer Ziffer',
    tierHinweis: 'Schau dir die Vorlage im Schreibtraining noch einmal in Ruhe an.',
    elternTipp: 'Im Elternbereich das Schreibtraining für unsichere Ziffern wiederholen.',
  },
  X0_unklar: {
    category: 'X0_unklar',
    title: 'Andere Abweichung',
    tierHinweis: 'Kein Problem! Schau dir die Tafel genau an und hüpf Schritt für Schritt.',
    elternTipp: 'Gemeinsam den Rechenweg Schritt für Schritt nachvollziehen.',
  },
};

export function matchAnswerToFaults(
  userAnswer: number,
  faults: TaskFaultCandidate[]
): ErrorCategoryCode[] {
  const matched = new Set<ErrorCategoryCode>();
  for (const f of faults) {
    if (typeof f.answer === 'number' && f.answer === userAnswer) {
      matched.add(f.category);
    }
  }
  if (matched.size === 0) {
    return ['X0_unklar'];
  }
  return Array.from(matched);
}
