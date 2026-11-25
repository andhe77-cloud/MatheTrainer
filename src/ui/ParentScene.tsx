import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FlaskConical,
  KeyRound,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Upload,
} from 'lucide-react';
import { APP_CONFIG } from '../content/config';
import { STRINGS_DE } from '../content/strings.de';
import type { AppStateV1, GameSettings, TaskLogEntry } from '../core/types';
import { buildDiagnosticReport } from '../diagnostics/patterns';
import { FullscreenButton } from './DesignSystem';

interface ParentSceneProps {
  state: AppStateV1;
  logs: TaskLogEntry[];
  learnedCount: number;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onExportBackup: () => Promise<string>;
  onImportBackup: (jsonText: string) => Promise<void>;
  onResetTraining: () => Promise<void>;
  onFullReset: () => Promise<void>;
  onOpenTestbed: () => void;
  onOpenPractice: () => void;
  onBack: () => void;
}

export const ParentScene: React.FC<ParentSceneProps> = ({
  state,
  logs,
  learnedCount,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onResetTraining,
  onFullReset,
  onOpenTestbed,
  onOpenPractice,
  onBack,
}) => {
  const hasPin = Boolean(state.settings.parentPin);
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryAnswer, setRecoveryAnswer] = useState('');

  const [tab, setTab] = useState<'overview' | 'settings' | 'data'>('overview');
  const [copiedReport, setCopiedReport] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const report = useMemo(
    () => buildDiagnosticReport(logs, state.playtimeByDate),
    [logs, state.playtimeByDate]
  );

  // Deterministic adult math recovery challenge (e.g. 14 * 4 + 9 = 65)
  const recoveryChallenge = { label: '14 × 4 + 9 = ?', expected: '65' };

  const handlePinSubmit = () => {
    setPinError(null);
    if (!hasPin) {
      if (!/^\d{4}$/.test(pinInput)) {
        setPinError('Bitte genau 4 Ziffern für Ihre neue Eltern-PIN eingeben.');
        return;
      }
      onUpdateSettings({ parentPin: pinInput });
      setUnlocked(true);
      setPinInput('');
      return;
    }

    if (pinInput === state.settings.parentPin) {
      setUnlocked(true);
      setPinInput('');
    } else {
      setPinError('PIN stimmt leider nicht.');
    }
  };

  if (!unlocked) {
    return (
      <div className="h-dvh overflow-y-auto no-scrollbar bg-slate-100 p-3 sm:p-4 flex flex-col">
        <div className="my-auto mx-auto w-full max-w-md rounded-3xl bg-white border-2 border-slate-200 p-5 sm:p-6 shadow-lg space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Zurück</span>
            </button>
            <KeyRound className="w-6 h-6 text-blue-600" />
          </div>

          {!recoveryMode ? (
            <>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">
                  {hasPin ? 'Elternbereich entsperren' : 'Eltern-PIN festlegen'}
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  {hasPin
                    ? 'Bitte geben Sie Ihre 4-stellige Eltern-PIN ein.'
                    : 'Legen Sie beim ersten Besuch eine 4-stellige PIN fest (schützt Einstellungen & Diagnose).'}
                </p>
              </div>

              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                placeholder="4 Ziffern"
                className="w-full min-h-[54px] px-4 rounded-2xl border-2 border-slate-300 text-center text-2xl font-extrabold tracking-[0.5em] text-slate-900 focus:border-blue-600 focus:outline-none"
              />

              {pinError && <p className="text-xs font-bold text-amber-700">{pinError}</p>}

              <button
                type="button"
                onClick={handlePinSubmit}
                className="w-full min-h-[54px] rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base"
              >
                {hasPin ? 'Öffnen' : 'PIN speichern & öffnen'}
              </button>

              {hasPin && (
                <button
                  type="button"
                  onClick={() => setRecoveryMode(true)}
                  className="w-full text-xs font-bold text-slate-500 hover:text-slate-800 py-1"
                >
                  PIN vergessen? Mit Rechenaufgabe entsperren
                </button>
              )}
            </>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">PIN-Wiederherstellung</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Bitte lösen Sie diese Erwachsenen-Aufgabe: <strong>{recoveryChallenge.label}</strong>
                </p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={recoveryAnswer}
                onChange={(e) => setRecoveryAnswer(e.target.value.replace(/\D/g, ''))}
                placeholder="Ergebnis"
                className="w-full min-h-[52px] px-4 rounded-2xl border-2 border-slate-300 text-center text-xl font-bold"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRecoveryMode(false)}
                  className="flex-1 min-h-[48px] rounded-xl border border-slate-300 font-bold text-sm"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (recoveryAnswer.trim() === recoveryChallenge.expected) {
                      onUpdateSettings({ parentPin: null });
                      setUnlocked(true);
                    } else {
                      setPinError('Das Ergebnis stimmt noch nicht.');
                    }
                  }}
                  className="flex-1 min-h-[48px] rounded-xl bg-blue-600 text-white font-bold text-sm"
                >
                  Prüfen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden bg-slate-50 p-2.5 sm:p-4 short:p-2 flex flex-col gap-2.5 sm:gap-3">
      {/* Header */}
      <header className="max-w-6xl w-full mx-auto bg-white rounded-2xl border-2 border-slate-200 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[40px] sm:min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 font-bold text-xs sm:text-sm flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück zum Spiel</span>
          </button>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900">Elternbereich</h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {(['overview', 'settings', 'data'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                tab === t
                  ? 'bg-blue-600 border-blue-700 text-white'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              {t === 'overview' ? 'Überblick & Diagnose' : t === 'settings' ? 'Einstellungen' : 'Daten & Handschrift'}
            </button>
          ))}
          <FullscreenButton compact />
        </div>
      </header>

      {/* Main Content Area (scrolls cleanly inside if narrow) */}
      <main className="flex-1 min-h-0 max-w-6xl w-full mx-auto overflow-y-auto pr-1 space-y-4">
        {statusMsg && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-300 px-4 py-2.5 text-sm font-bold text-emerald-900">
            {statusMsg}
          </div>
        )}

        {tab === 'overview' && (
          <div className="space-y-4">
            {/* Summary Metrics + Disclaimer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-bold text-slate-500">Aufgaben (letzte 7 Tage)</div>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
                  {report.totalTasks7Days}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="text-xs font-bold text-slate-500">Geschätzte Spielzeit (7 Tage)</div>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
                  {report.totalMinutes7Days} Min.
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-500">Wochenbericht</div>
                  <div className="text-xs text-slate-600 mt-0.5">Für Lehrkraft oder Notizen</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(report.weeklySummaryText);
                    setCopiedReport(true);
                    setTimeout(() => setCopiedReport(false), 2000);
                  }}
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  {copiedReport ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedReport ? 'Kopiert' : 'Kopieren'}</span>
                </button>
              </div>
            </div>

            {/* World Accuracy Bar Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <h2 className="text-sm font-extrabold text-slate-900">Trefferquote je Lernwelt</h2>
              <div className="space-y-2">
                {report.worldAccuracy.map((w) => (
                  <div key={w.world} className="grid grid-cols-[115px_1fr_58px] sm:grid-cols-[190px_1fr_70px] items-center gap-2 sm:gap-3 text-xs">
                    <span className="font-bold text-slate-700 truncate">{w.name}</span>
                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${w.accuracyPct}%` }}
                      />
                    </div>
                    <span className="font-bold text-slate-600 tabular-nums text-right">
                      {w.total > 0 ? `${w.accuracyPct}% (${w.total})` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Active Error Patterns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-emerald-200 p-4 space-y-2.5">
                <h2 className="text-sm font-extrabold text-emerald-900">Das klappt schon gut</h2>
                {report.strengths.length === 0 ? (
                  <p className="text-xs text-slate-600">
                    Nach einigen gelösten Aufgaben erscheinen hier die besonderen Stärken Ihres Kindes.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {report.strengths.map((s) => (
                      <li key={s.skill} className="flex items-center justify-between text-xs bg-emerald-50 px-3 py-2 rounded-xl">
                        <span className="font-bold text-emerald-900">{s.label}</span>
                        <span className="font-extrabold text-emerald-700 tabular-nums">{s.accuracyPct}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-amber-200 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-amber-900">Auffälligkeiten & Tipps</h2>
                  {report.activePatterns.length > 0 && (
                    <button
                      type="button"
                      onClick={onOpenPractice}
                      className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-extrabold flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Übungsinsel starten</span>
                    </button>
                  )}
                </div>

                {report.activePatterns.length === 0 ? (
                  <p className="text-xs text-slate-600">
                    Aktuell zeigen sich keine wiederkehrenden Fehlermuster.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {report.activePatterns.map((p) => (
                      <div key={p.category} className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs space-y-1">
                        <div className="font-extrabold text-amber-950">
                          {p.label} ({p.countInRecent12}/12)
                        </div>
                        <p className="text-amber-900">{p.elternTipp}</p>
                        {p.exampleMismatch && (
                          <p className="text-[11px] text-amber-700">
                            Beispiel: Aufgabe {p.exampleMismatch.expected} · Eingabe {p.exampleMismatch.input}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {report.writingObservations.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="text-xs font-bold text-slate-700">Schrift & Erkennung (7 Tage):</div>
                    {report.writingObservations.map((w) => (
                      <div key={w.category} className="text-xs text-slate-600">
                        • <strong>{w.label}</strong> ({w.count}×): {w.tip}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{report.disclaimer}</span>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Hundertertafel startet bei</div>
                <div className="text-xs text-slate-500">Bayern Standard ist 1 (1–100)</div>
              </div>
              <select
                value={state.settings.tafelStart}
                onChange={(e) => onUpdateSettings({ tafelStart: Number(e.target.value) as 1 | 0 })}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-bold"
              >
                <option value={1}>1 (1–100)</option>
                <option value={0}>0 (0–99)</option>
              </select>
            </label>

            <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Zahlenstrahl-Zählweise (O1)</div>
                <div className="text-xs text-slate-500">Ob Startstrich mitgezählt wird</div>
              </div>
              <select
                value={state.settings.strichZaehlung}
                onChange={(e) =>
                  onUpdateSettings({
                    strichZaehlung: e.target.value as GameSettings['strichZaehlung'],
                  })
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-bold"
              >
                <option value="start_zaehlt_nicht">Start zählt nicht (Standard)</option>
                <option value="start_ist_erster">Start ist erster Strich</option>
              </select>
            </label>

            <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Zehnerübergang aktiv</div>
                <div className="text-xs text-slate-500">Kann zum Üben ohne Übertrag pausiert werden</div>
              </div>
              <input
                type="checkbox"
                checked={state.settings.zehneruebergangEnabled}
                onChange={(e) => onUpdateSettings({ zehneruebergangEnabled: e.target.checked })}
                className="w-5 h-5"
              />
            </label>

            <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Sprachausgabe (Vorlesen)</div>
                <div className="text-xs text-slate-500">Aufgaben und Zahlwörter auf Deutsch vorlesen</div>
              </div>
              <input
                type="checkbox"
                checked={state.settings.readAloud}
                onChange={(e) => onUpdateSettings({ readAloud: e.target.checked })}
                className="w-5 h-5"
              />
            </label>

            <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Linkshänder-Modus</div>
                <div className="text-xs text-slate-500">Fertig-Knopf links neben den Kästchen</div>
              </div>
              <input
                type="checkbox"
                checked={state.settings.leftHanded}
                onChange={(e) => onUpdateSettings({ leftHanded: e.target.checked })}
                className="w-5 h-5"
              />
            </label>

            <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Weniger Bewegung</div>
                <div className="text-xs text-slate-500">Ruhigere Übergänge ohne Hüpf-Animationen</div>
              </div>
              <input
                type="checkbox"
                checked={state.settings.reducedMotion}
                onChange={(e) => onUpdateSettings({ reducedMotion: e.target.checked })}
                className="w-5 h-5"
              />
            </label>

            <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Pausenhinweis (Minuten)</div>
                <div className="text-xs text-slate-500">Tier gähnt sanft nach dieser Zeit</div>
              </div>
              <select
                value={state.settings.pauseReminderMinutes}
                onChange={(e) => onUpdateSettings({ pauseReminderMinutes: Number(e.target.value) })}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-bold"
              >
                <option value={10}>10 Minuten</option>
                <option value={15}>15 Minuten</option>
                <option value={25}>25 Minuten</option>
              </select>
            </label>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">Freigegebene Lernwelten</div>
              <div className="flex flex-wrap gap-2">
                {APP_CONFIG.worlds.map((w) => {
                  const enabled = state.settings.enabledWorlds.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        const next = enabled
                          ? state.settings.enabledWorlds.filter((id) => id !== w.id)
                          : [...state.settings.enabledWorlds, w.id].sort();
                        if (next.length > 0) onUpdateSettings({ enabledWorlds: next });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                        enabled
                          ? 'bg-blue-600 border-blue-700 text-white'
                          : 'bg-white border-slate-300 text-slate-600'
                      }`}
                    >
                      {STRINGS_DE.worlds[w.id].name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'data' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h2 className="text-base font-extrabold text-slate-900">Handschrift & Testmodus</h2>
              <p className="text-xs text-slate-600">
                Aktuell gelernte Ziffern-Vorlagen Ihres Kindes: <strong>{learnedCount}</strong>.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onOpenTestbed}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>Schreib-Labor öffnen</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onResetTraining();
                    setStatusMsg('Gelernte Handschrift-Vorlagen wurden zurückgesetzt.');
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Handschrift-Training löschen</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h2 className="text-base font-extrabold text-slate-900">Datensicherung (Lokal / JSON)</h2>
              <p className="text-xs text-slate-600">
                Sichern Sie Fortschritt, Album, Insel & Vorlagen als Datei oder spielen Sie ein Backup ein.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const json = await onExportBackup();
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `kloetzchen-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setStatusMsg('Backup-Datei wurde heruntergeladen.');
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Backup exportieren</span>
                </button>

                <label className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Backup einspielen</span>
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const txt = await file.text();
                      await onImportBackup(txt);
                      setStatusMsg('Backup erfolgreich wiederhergestellt!');
                    }}
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-slate-100">
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="text-xs font-bold text-amber-800 hover:underline"
                  >
                    Kompletten Spielstand zurücksetzen …
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await onFullReset();
                        setConfirmReset(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-amber-950 font-bold text-xs"
                    >
                      Wirklich alles löschen
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                    >
                      Abbrechen
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
