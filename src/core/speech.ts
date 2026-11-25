const UNITS = ['', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
const UNITS_PREFIX = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
const TEENS = [
  'zehn',
  'elf',
  'zwölf',
  'dreizehn',
  'vierzehn',
  'fünfzehn',
  'sechzehn',
  'siebzehn',
  'achtzehn',
  'neunzehn',
];
const TENS = [
  '',
  'zehn',
  'zwanzig',
  'dreißig',
  'vierzig',
  'fünfzig',
  'sechzig',
  'siebzig',
  'achtzig',
  'neunzig',
];

/**
 * Rule-based German number word generator (0..999).
 * Examples: 0 -> "null", 1 -> "eins", 21 -> "einundzwanzig", 84 -> "vierundachtzig", 100 -> "einhundert".
 */
export function numberToGermanWords(n: number): string {
  const num = Math.floor(Math.abs(n));
  if (num === 0) return 'null';
  if (num >= 1000) return String(num);

  const hundreds = Math.floor(num / 100);
  const rest = num % 100;

  let result = '';
  if (hundreds > 0) {
    result += `${UNITS_PREFIX[hundreds]}hundert`;
  }

  if (rest === 0) {
    return result;
  }

  if (rest < 10) {
    return result + UNITS[rest];
  }
  if (rest < 20) {
    return result + TEENS[rest - 10];
  }

  const ten = Math.floor(rest / 10);
  const one = rest % 10;
  if (one === 0) {
    return result + TENS[ten];
  }
  return `${result}${UNITS_PREFIX[one]}und${TENS[ten]}`;
}

export function splitTensOnes(n: number): { hundreds: number; tensValue: number; onesValue: number } {
  const clamped = Math.max(0, Math.floor(n));
  const hundreds = Math.floor(clamped / 100) * 100;
  const rem = clamped % 100;
  const tensValue = Math.floor(rem / 10) * 10;
  const onesValue = rem % 10;
  return { hundreds, tensValue, onesValue };
}

export function speakGerman(text: string, enabled = true): boolean {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    const voices = synth.getVoices();
    const deVoice = voices.find((v) => v.lang.toLowerCase().startsWith('de'));
    if (deVoice) {
      utterance.voice = deVoice;
    }
    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore browser speech cancel errors
  }
}
