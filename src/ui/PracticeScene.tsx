import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Megaphone, MegaphoneOff, Sparkles } from 'lucide-react';
import { soundEngine } from '../core/audio';
import { speakGerman } from '../core/speech';
import type { AppStateV1, DigitTemplate, ErrorCategoryCode, TaskLogEntry } from '../core/types';
import { DIAGNOSTIC_HINTS } from '../diagnostics/errorModel';
import type { ActiveErrorPattern } from '../diagnostics/patterns';
import { NumberInputPad, type NumberConfirmPayload } from '../input/NumberInputPad';
import { evaluateFieldForWorld, generatePracticeTasksForCategory } from '../tasks/dailyAdventure';
import { FullscreenButton } from './DesignSystem';
import { HundertertafelBoard } from './HundertertafelBoard';
import { Mascot } from './Mascot';
import { RechenwerkstattBoard } from './RechenwerkstattBoard';
import { ZahlenmauerBoard } from './ZahlenmauerBoard';
import { ZahlenstrahlBoard } from './ZahlenstrahlBoard';
import { ZehneruebergangBoard } from './ZehneruebergangBoard';
import { WorldBackdrop } from './WorldBackdrop';

interface PracticeSceneProps {
  state: AppStateV1;
  patterns: ActiveErrorPattern[];
  learnedTemplates: DigitTemplate[];
  onSaveLearnedTemplate: (tpl: DigitTemplate) => Promise<void> | void;
  onLogTask: (entry: TaskLogEntry) => Promise<void> | void;
  onRewardCoins: (coins: number) => void;
  onToggleReadAloud: () => void;
  onBack: () => void;
}

function getGuidedExamples(cat: ErrorCategoryCode): Array<{ title: string; visual: string; text: string }> {
  if (cat.startsWith('H1') || cat.startsWith('H4') || cat.startsWith('H2')) {
    return [
      { title: 'Schritt 1: Nach rechts & links', visual: '24 → 25 (+1)', text: 'Nach rechts wird die Einer-Zahl um 1 größer.' },
      { title: 'Schritt 2: Nach oben & unten', visual: '24 ↓ 34 (+10)', text: 'Eine Zeile tiefer bedeutet immer +10!' },
      { title: 'Schritt 3: Merksatz', visual: '← −1 · → +1 · ↑ −10 · ↓ +10', text: 'Schau immer zuerst auf die Richtung der Pfeile.' },
    ];
  }
  if (cat.startsWith('Z')) {
    return [
      { title: 'Schritt 1: Große Striche', visual: '0 — 10 — 20 — 30', text: 'Die großen Striche zeigen dir immer den Weg.' },
      { title: 'Schritt 2: Richtig zählen', visual: 'Start (10) ↷ 11 ↷ 12', text: 'Erst beim ersten Sprung zählst du „eins“!' },
      { title: 'Schritt 3: Richtung prüfen', visual: '← kleiner | größer →', text: 'Nach rechts werden die Zahlen größer, nach links kleiner.' },
    ];
  }
  if (cat === 'R1_uebergang_ausgelassen' || cat === 'R4_rest_vergessen') {
    return [
      { title: 'Schritt 1: Bis zum Zehner', visual: '27 + 3 = 30', text: 'Fülle zuerst immer bis zum nächsten vollen Zehner auf.' },
      { title: 'Schritt 2: Rest dazu', visual: '30 + 3 = 33', text: 'Hänge dann den Rest an den vollen Zehner dran.' },
      { title: 'Schritt 3: Ganze Aufgabe', visual: '27 + 6 = 27 + 3 + 3 = 33', text: 'So wird jeder Zehnerübergang kinderleicht!' },
    ];
  }
  if (cat === 'R5_kleine_minus_grosse') {
    return [
      { title: 'Schritt 1: Achtung bei Minus', visual: '43 − 7 ≠ 44', text: 'Bei Minus darf man Einer nicht einfach umdrehen!' },
      { title: 'Schritt 2: Erst bis zum Zehner', visual: '43 − 3 = 40', text: 'Hüpfe erst zur glatten Zehnerzahl zurück.' },
      { title: 'Schritt 3: Den Rest abziehen', visual: '40 − 4 = 36', text: 'Ziehe vom Zehner den Rest ab: 43 − 7 = 36.' },
    ];
  }
  if (cat.startsWith('M')) {
    return [
      { title: 'Schritt 1: Nach oben bauen', visual: '[ 5 ] + [ 4 ] = [ 9 ] darüber', text: 'Zwei Steine nebeneinander ergeben zusammen den Stein darüber.' },
      { title: 'Schritt 2: Unten suchen', visual: '[ ? ] + [ 4 ] = [ 9 ] → 9 − 4 = 5', text: 'Fehlt ein unterer Stein, rechne oben minus den Nachbarn!' },
      { title: 'Schritt 3: Gegenprobe', visual: '5 + 4 = 9 ✓', text: 'Prüfe zum Schluss noch einmal von unten nach oben.' },
    ];
  }
  return [
    { title: 'Schritt 1: Ruhe bewahren', visual: 'Zehner (Blau) · Einer (Rot)', text: 'Schau genau hin, welche Stelle gefragt ist.' },
    { title: 'Schritt 2: Laut mitsprechen', visual: '30 + 4 = 34', text: 'Sprich die Zahl im Kopf: erst Einer, dann Zehner.' },
    { title: 'Schritt 3: Tier-Hüpfer nutzen', visual: 'Schritt für Schritt ans Ziel', text: 'Wir üben jetzt 4 kurze Aufgaben zusammen!' },
  ];
}

export const PracticeScene: React.FC<PracticeSceneProps> = ({
  state,
  patterns,
  learnedTemplates,
  onSaveLearnedTemplate,
  onLogTask,
  onRewardCoins,
  onToggleReadAloud,
  onBack,
}) => {
  const profile = state.profile!;
  const targetPattern = patterns[0];
  const category: ErrorCategoryCode = targetPattern?.category ?? 'H1_oben_unten';
  const hintInfo = DIAGNOSTIC_HINTS[category];
  const examples = useMemo(() => getGuidedExamples(category), [category]);

  const tasks = useMemo(
    () => generatePracticeTasksForCategory(category, state.settings),
    [category, state.settings]
  );

  const [phase, setPhase] = useState<'guide' | 'practice' | 'done'>('guide');
  const [exIdx, setExIdx] = useState(0);
  const [taskIdx, setTaskIdx] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [padKey, setPadKey] = useState(0);

  const currentTask = tasks[taskIdx];
  const activeField = currentTask?.fields[0];

  const handlePracticeConfirm = (payload: NumberConfirmPayload) => {
    if (!currentTask || !activeField) return;
    const evalRes = evaluateFieldForWorld(currentTask.world, activeField, payload.value);
    void onLogTask({
      id: `prac_${Date.now()}`,
      timestamp: Date.now(),
      world: currentTask.world,
      level: currentTask.level,
      skill: currentTask.skill,
      parameters: { practiceCategory: category },
      expected: activeField.expected,
      input: payload.value,
      recognitionConfidence: payload.avgConfidence,
      clarified: payload.clarifiedCount > 0,
      errorCategories: evalRes.correct ? [] : evalRes.categories,
      helpLevel: 0,
      durationToFirstStrokeMs: 0,
      durationTotalMs: 2000,
      attempts: evalRes.correct ? 1 : 2,
      animalHelpUsed: false,
    });

    if (evalRes.correct) {
      soundEngine.playSuccessChime();
      setFeedback('Klasse gemacht! Genau so geht’s!');
      window.setTimeout(() => {
        setFeedback(null);
        if (taskIdx + 1 >= tasks.length) {
          onRewardCoins(8);
          setPhase('done');
        } else {
          setTaskIdx((i) => i + 1);
          setPadKey((k) => k + 1);
        }
      }, 900);
    } else {
      soundEngine.playHmTone();
      setFeedback(`${hintInfo.tierHinweis} (Gesucht war ein anderes Ergebnis – probier’s gleich nochmal!)`);
      setPadKey((k) => k + 1);
    }
  };

  if (phase === 'done') {
    return (
      <div className="h-dvh overflow-y-auto no-scrollbar relative p-3 sm:p-4 flex flex-col">
        <WorldBackdrop worldId={currentTask?.world ?? 1} isDaily />
        <div className="relative z-10 my-auto mx-auto w-full max-w-md rounded-3xl bg-white/95 border-2 border-emerald-300 p-6 sm:p-7 short:p-4 shadow-[0_8px_0_#A7F3D0] text-center flex flex-col items-center gap-4 short:gap-2.5">
          <Mascot
            animal={profile.animal}
            mood="happy"
            size={112}
            reducedMotion={state.settings.reducedMotion}
            equipped={state.equippedAccessories}
          />
          <h1 className="text-2xl short:text-xl font-extrabold text-slate-900">Übungsinsel gemeistert!</h1>
          <p className="text-sm font-semibold text-slate-600">
            Super geübt! {profile.animalName} schenkt dir +8 Goldklötzchen.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="w-full min-h-[56px] short:min-h-[46px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-[0_4px_0_#047857]"
          >
            Zurück zur Karte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden relative p-2.5 sm:p-4 short:p-2 flex flex-col gap-2 sm:gap-3 short:gap-1.5">
      <WorldBackdrop worldId={currentTask?.world ?? 1} />
      <header className="relative z-10 max-w-6xl w-full mx-auto bg-white/95 rounded-2xl border-2 border-slate-200 px-3 sm:px-4 py-1.5 sm:py-2 short:py-1 shadow-[0_3px_0_#CBD5E1] flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[40px] sm:min-h-[44px] short:min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Karte</span>
        </button>

        <div className="flex items-center gap-1.5 text-center min-w-0">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs sm:text-base short:text-xs font-extrabold text-slate-900 truncate">
            Übungsinsel · {hintInfo.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleReadAloud}
            aria-label={state.settings.readAloud ? 'Vorlesen ausschalten' : 'Vorlesen einschalten'}
            title={state.settings.readAloud ? 'Vorlesen: An' : 'Vorlesen: Aus'}
            className={`min-h-[40px] sm:min-h-[44px] short:min-h-[36px] px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1 ${
              state.settings.readAloud
                ? 'border-blue-200 bg-blue-50 text-blue-800'
                : 'border-slate-300 bg-slate-100 text-slate-500'
            }`}
          >
            {state.settings.readAloud ? <Megaphone className="w-4 h-4" /> : <MegaphoneOff className="w-4 h-4" />}
            <span className="hidden md:inline">{state.settings.readAloud ? 'Vorlesen' : 'Aus'}</span>
          </button>
          <FullscreenButton compact />
        </div>
      </header>

      {phase === 'guide' ? (
        <main className="relative z-10 flex-1 min-h-0 overflow-y-auto no-scrollbar max-w-3xl w-full mx-auto flex flex-col">
          <div className="my-auto w-full rounded-3xl bg-white border-2 border-blue-200 p-5 sm:p-8 short:p-4 shadow-[0_6px_0_#BFDBFE] flex flex-col items-center text-center gap-4 sm:gap-5 short:gap-2.5">
            <div className="flex items-center gap-3">
              <div className="[&_svg]:w-16 [&_svg]:h-16 sm:[&_svg]:w-[84px] sm:[&_svg]:h-[84px] short:[&_svg]:w-14 short:[&_svg]:h-14">
                <Mascot
                  animal={profile.animal}
                  mood="nod"
                  size={84}
                  reducedMotion={state.settings.reducedMotion}
                  equipped={state.equippedAccessories}
                />
              </div>
              <div className="text-left">
                <span className="text-xs font-extrabold text-blue-700 uppercase">
                  Beispiel {exIdx + 1} von {examples.length}
                </span>
                <h2 className="text-lg sm:text-xl short:text-base font-extrabold text-slate-900">{examples[exIdx].title}</h2>
              </div>
            </div>

            <div className="w-full rounded-2xl bg-sky-50 border-2 border-sky-200 p-4 sm:p-5 short:p-3 text-xl sm:text-3xl short:text-lg font-extrabold text-blue-900">
              {examples[exIdx].visual}
            </div>

            <p className="text-sm sm:text-base font-semibold text-slate-700">{examples[exIdx].text}</p>

            <button
              type="button"
              onClick={() => {
                soundEngine.playBlockTap();
                if (exIdx + 1 < examples.length) {
                  setExIdx((i) => i + 1);
                  if (state.settings.readAloud) speakGerman(examples[exIdx + 1].text, true);
                } else {
                  setPhase('practice');
                }
              }}
              className="min-h-[52px] sm:min-h-[56px] short:min-h-[44px] px-7 sm:px-8 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm sm:text-base shadow-[0_4px_0_#1D4ED8] flex items-center gap-2"
            >
              {exIdx + 1 < examples.length ? (
                <>
                  <span>Nächstes Beispiel</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Jetzt 4 Aufgaben üben!</span>
                </>
              )}
            </button>
          </div>
        </main>
      ) : (
        currentTask && (
          <main className="relative z-10 flex-1 min-h-0 overflow-y-auto no-scrollbar max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-3 sm:gap-4 short:gap-2.5 items-start md:items-center short:items-start pb-1">
            <div className="space-y-2.5 sm:space-y-3 short:space-y-2 min-w-0">
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-3 sm:p-4 short:p-2 flex items-center gap-3">
                <div className="hidden sm:block short:hidden">
                  <Mascot
                    animal={profile.animal}
                    mood="idle"
                    size={56}
                    reducedMotion={state.settings.reducedMotion}
                    equipped={state.equippedAccessories}
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-blue-700">
                    Übung {taskIdx + 1} / {tasks.length}
                  </span>
                  <h2 className="text-base sm:text-lg short:text-sm font-extrabold text-slate-900">{currentTask.promptText}</h2>
                </div>
              </div>

              {currentTask.world === 1 && (
                <HundertertafelBoard
                  task={currentTask}
                  animal={profile.animal}
                  mascotMood="idle"
                  mascotCell={currentTask.boardContext?.startCell ?? null}
                  trailCells={[]}
                  activeFieldId={activeField?.id ?? null}
                  filledAnswers={{}}
                  tapCompleted={true}
                  showDotView={false}
                  showLandingBadge={null}
                  reducedMotion={state.settings.reducedMotion}
                />
              )}
              {currentTask.world === 2 && (
                <ZahlenstrahlBoard
                  task={currentTask}
                  animal={profile.animal}
                  mascotMood="idle"
                  mascotMark={currentTask.numberLineContext?.startMark ?? null}
                  trailMarks={[]}
                  filledAnswers={{}}
                  showLandingBadge={null}
                  reducedMotion={state.settings.reducedMotion}
                  onTapMark={(mark) => {
                    if (currentTask.inputMode === 'tap_mark') {
                      handlePracticeConfirm({
                        value: mark,
                        tensDigit: Math.floor(mark / 10),
                        onesDigit: mark % 10,
                        hundredsDigit: null,
                        mirroredDigits: [],
                        clarifiedCount: 0,
                        avgConfidence: 1,
                        hadTensInWrongBox: false,
                      });
                    }
                  }}
                />
              )}
              {currentTask.world === 3 && (
                <ZehneruebergangBoard
                  task={currentTask}
                  animal={profile.animal}
                  mascotMood="idle"
                  hopStep={0}
                  filledAnswers={{}}
                  showLandingBadge={null}
                  reducedMotion={state.settings.reducedMotion}
                />
              )}
              {currentTask.world === 4 && (
                <RechenwerkstattBoard
                  task={currentTask}
                  animal={profile.animal}
                  mascotMood="idle"
                  filledAnswers={{}}
                  showLandingBadge={null}
                  reducedMotion={state.settings.reducedMotion}
                />
              )}
              {currentTask.world === 5 && (
                <ZahlenmauerBoard
                  task={currentTask}
                  animal={profile.animal}
                  mascotMood="idle"
                  activeFieldId={activeField?.id ?? null}
                  filledAnswers={{}}
                  showLandingBadge={null}
                  reducedMotion={state.settings.reducedMotion}
                />
              )}
            </div>

            <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 shadow-[0_4px_0_#CBD5E1] flex flex-col items-center gap-4">
              {feedback && (
                <div className="w-full rounded-2xl bg-amber-50 border-2 border-amber-200 px-4 py-2.5 text-sm font-bold text-amber-950 text-center">
                  {feedback}
                </div>
              )}
              {currentTask.inputMode === 'tap_mark' ? (
                <p className="text-base font-bold text-teal-800 text-center py-6">
                  Tippe direkt links auf den passenden Strich!
                </p>
              ) : (
                <NumberInputPad
                  key={padKey}
                  allowHundreds={activeField?.allowHundreds}
                  learnedTemplates={learnedTemplates}
                  onSaveLearnedTemplate={onSaveLearnedTemplate}
                  onConfirm={handlePracticeConfirm}
                  leftHanded={state.settings.leftHanded}
                />
              )}
            </div>
          </main>
        )
      )}
    </div>
  );
};
