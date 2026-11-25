import { APP_CONFIG } from '../content/config';
import type { AppStateV1, DigitTemplate, ExportBundle, TaskLogEntry } from './types';

const DB_NAME = 'kloetzchen-abenteuer-db';
const DB_VERSION = 1;
const STORE_STATE = 'state';
const STORE_TEMPLATES = 'templates';
const STORE_LOGS = 'logs';
const MAIN_STATE_KEY = 'main';

export function createDefaultState(): AppStateV1 {
  const worldProgress: AppStateV1['worldProgress'] = {};
  for (const w of APP_CONFIG.worlds) {
    worldProgress[w.id] = { unlockedLevel: 1, starsByLevel: {} };
  }
  return {
    schemaVersion: 1,
    profile: null,
    settings: { ...APP_CONFIG.defaultSettings },
    worldProgress,
    skillMastery: {},
    skillProgress: {},
    inventory: ['block_grass', 'block_wood', 'block_stone', 'block_water', 'plant_daisy', 'deco_flag'],
    unlockedStickers: [],
    chestsOpened: 0,
    dailyAdventureDate: null,
    playtimeByDate: {},
    wishlistItemId: null,
    equippedAccessories: {
      hat: null,
      cape: null,
      backpack: null,
      hopEffect: null,
    },
    hubPlacements: [
      { itemId: 'block_grass', x: 1, y: 2, z: 0, rotation: 0 },
      { itemId: 'plant_daisy', x: 1, y: 2, z: 1, rotation: 0 },
      { itemId: 'block_stone', x: 2, y: 2, z: 0, rotation: 0 },
      { itemId: 'block_wood', x: 2, y: 2, z: 1, rotation: 0 },
      { itemId: 'deco_flag', x: 2, y: 2, z: 2, rotation: 0 },
      { itemId: 'block_water', x: 5, y: 2, z: 0, rotation: 0 },
    ],
    completedBuildQuests: [],
    activeSeriesId: 'panda',
    unlockedPuzzlePieces: {},
    activePuzzleId: 'pz_racecar',
  };
}

export function migrateState(raw: unknown): AppStateV1 {
  const defaults = createDefaultState();
  if (!raw || typeof raw !== 'object') {
    return defaults;
  }
  const obj = raw as Record<string, unknown>;
  // Future migrations (e.g., schemaVersion 0 -> 1) handled cleanly here
  const rawSettings = (obj.settings && typeof obj.settings === 'object' ? obj.settings : {}) as Record<
    string,
    unknown
  >;
  const rawProfile = obj.profile && typeof obj.profile === 'object' ? (obj.profile as AppStateV1['profile']) : null;
  const rawWorldProgress =
    obj.worldProgress && typeof obj.worldProgress === 'object'
      ? (obj.worldProgress as AppStateV1['worldProgress'])
      : {};

  const normalizedPlacements = Array.isArray(obj.hubPlacements)
    ? (obj.hubPlacements as Array<Record<string, unknown>>)
        .filter((p) => p && typeof p.itemId === 'string' && typeof p.x === 'number' && typeof p.y === 'number')
        .map((p) => ({
          itemId: p.itemId as string,
          x: p.x as number,
          y: p.y as number,
          z: typeof p.z === 'number' ? p.z : 0,
          rotation: typeof p.rotation === 'number' ? p.rotation : 0,
        }))
    : defaults.hubPlacements;

  return {
    schemaVersion: 1,
    profile: rawProfile,
    settings: {
      ...defaults.settings,
      ...(rawSettings as Partial<AppStateV1['settings']>),
    },
    worldProgress: {
      ...defaults.worldProgress,
      ...rawWorldProgress,
    },
    skillMastery:
      obj.skillMastery && typeof obj.skillMastery === 'object'
        ? (obj.skillMastery as Record<string, number>)
        : {},
    skillProgress:
      obj.skillProgress && typeof obj.skillProgress === 'object'
        ? (obj.skillProgress as AppStateV1['skillProgress'])
        : {},
    inventory: Array.isArray(obj.inventory) ? (obj.inventory as string[]) : defaults.inventory,
    unlockedStickers: Array.isArray(obj.unlockedStickers) ? (obj.unlockedStickers as string[]) : [],
    chestsOpened: typeof obj.chestsOpened === 'number' ? obj.chestsOpened : 0,
    dailyAdventureDate: typeof obj.dailyAdventureDate === 'string' ? obj.dailyAdventureDate : null,
    playtimeByDate:
      obj.playtimeByDate && typeof obj.playtimeByDate === 'object'
        ? (obj.playtimeByDate as Record<string, number>)
        : {},
    wishlistItemId: typeof obj.wishlistItemId === 'string' ? obj.wishlistItemId : null,
    equippedAccessories:
      obj.equippedAccessories && typeof obj.equippedAccessories === 'object'
        ? { ...defaults.equippedAccessories, ...(obj.equippedAccessories as AppStateV1['equippedAccessories']) }
        : defaults.equippedAccessories,
    hubPlacements: normalizedPlacements,
    completedBuildQuests: Array.isArray(obj.completedBuildQuests)
      ? (obj.completedBuildQuests as string[])
      : [],
    activeSeriesId:
      typeof obj.activeSeriesId === 'string' &&
      !['dschungel', 'bauernhof', 'wald', 'weltraum'].includes(obj.activeSeriesId)
        ? obj.activeSeriesId
        : 'panda',
    unlockedPuzzlePieces: (() => {
      const result: Record<string, number[]> = {};
      if (obj.unlockedPuzzlePieces && typeof obj.unlockedPuzzlePieces === 'object') {
        for (const [k, v] of Object.entries(obj.unlockedPuzzlePieces as Record<string, unknown>)) {
          if (Array.isArray(v)) {
            const clean = Array.from(
              new Set(v.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < 6))
            ).sort((a, b) => a - b);
            if (clean.length > 0) {
              result[k] = clean;
            }
          }
        }
      }
      return result;
    })(),
    activePuzzleId: typeof obj.activePuzzleId === 'string' && obj.activePuzzleId ? obj.activePuzzleId : 'pz_racecar',
  };
}

// Memory fallback for non-browser unit test environments
class MemoryStorageBackend {
  state: AppStateV1 = createDefaultState();
  templates: DigitTemplate[] = [];
  logs: TaskLogEntry[] = [];
}

const memoryFallback = new MemoryStorageBackend();

function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_STATE)) {
        db.createObjectStore(STORE_STATE);
      }
      if (!db.objectStoreNames.contains(STORE_TEMPLATES)) {
        const store = db.createObjectStore(STORE_TEMPLATES, { keyPath: 'id' });
        store.createIndex('digit', 'digit', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_LOGS)) {
        const logStore = db.createObjectStore(STORE_LOGS, { keyPath: 'id' });
        logStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      return await navigator.storage.persist();
    }
  } catch {
    // Ignore storage persistence errors on unsupported browsers
  }
  return false;
}

export async function loadAppState(): Promise<AppStateV1> {
  if (!hasIndexedDB()) {
    return migrateState(memoryFallback.state);
  }
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_STATE, 'readonly');
    const store = tx.objectStore(STORE_STATE);
    const req = store.get(MAIN_STATE_KEY);
    req.onsuccess = () => {
      resolve(migrateState(req.result));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveAppState(state: AppStateV1): Promise<void> {
  const normalized = migrateState(state);
  if (!hasIndexedDB()) {
    memoryFallback.state = normalized;
    return;
  }
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_STATE, 'readwrite');
    tx.objectStore(STORE_STATE).put(normalized, MAIN_STATE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadLearnedTemplates(): Promise<DigitTemplate[]> {
  if (!hasIndexedDB()) {
    return [...memoryFallback.templates];
  }
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TEMPLATES, 'readonly');
    const req = tx.objectStore(STORE_TEMPLATES).getAll();
    req.onsuccess = () => resolve((req.result as DigitTemplate[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLearnedTemplate(template: DigitTemplate): Promise<DigitTemplate[]> {
  const maxPerDigit = APP_CONFIG.recognition.maxLearnedPerDigit;
  const all = await loadLearnedTemplates();
  const sameDigit = all
    .filter((t) => t.digit === template.digit)
    .sort((a, b) => a.createdAt - b.createdAt);
  const others = all.filter((t) => t.digit !== template.digit);

  const updatedSame = [...sameDigit, template];
  const evicted: DigitTemplate[] = [];
  while (updatedSame.length > maxPerDigit) {
    const removed = updatedSame.shift();
    if (removed) evicted.push(removed);
  }

  if (!hasIndexedDB()) {
    memoryFallback.templates = [...others, ...updatedSame];
    return memoryFallback.templates;
  }

  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_TEMPLATES, 'readwrite');
    const store = tx.objectStore(STORE_TEMPLATES);
    for (const rem of evicted) {
      store.delete(rem.id);
    }
    store.put(template);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return [...others, ...updatedSame];
}

export async function clearLearnedTemplates(): Promise<void> {
  if (!hasIndexedDB()) {
    memoryFallback.templates = [];
    return;
  }
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_TEMPLATES, 'readwrite');
    tx.objectStore(STORE_TEMPLATES).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function appendTaskLog(entry: TaskLogEntry): Promise<void> {
  if (!hasIndexedDB()) {
    memoryFallback.logs.push(entry);
    return;
  }
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_LOGS, 'readwrite');
    tx.objectStore(STORE_LOGS).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadTaskLogs(): Promise<TaskLogEntry[]> {
  if (!hasIndexedDB()) {
    return [...memoryFallback.logs];
  }
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LOGS, 'readonly');
    const req = tx.objectStore(STORE_LOGS).getAll();
    req.onsuccess = () => resolve((req.result as TaskLogEntry[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function exportBackupBundle(): Promise<ExportBundle> {
  const [state, learnedTemplates, logs] = await Promise.all([
    loadAppState(),
    loadLearnedTemplates(),
    loadTaskLogs(),
  ]);
  return {
    exportedAt: Date.now(),
    schemaVersion: APP_CONFIG.schemaVersion,
    state,
    learnedTemplates,
    logs,
  };
}

export async function importBackupBundle(bundle: unknown): Promise<AppStateV1> {
  if (!bundle || typeof bundle !== 'object') {
    throw new Error('Ungültige Sicherungsdatei.');
  }
  const parsed = bundle as Partial<ExportBundle>;
  const migratedState = migrateState(parsed.state);
  await saveAppState(migratedState);

  const templates = Array.isArray(parsed.learnedTemplates) ? parsed.learnedTemplates : [];
  const logs = Array.isArray(parsed.logs) ? parsed.logs : [];

  if (!hasIndexedDB()) {
    memoryFallback.templates = templates;
    memoryFallback.logs = logs;
    return migratedState;
  }

  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_TEMPLATES, STORE_LOGS], 'readwrite');
    const tplStore = tx.objectStore(STORE_TEMPLATES);
    const logStore = tx.objectStore(STORE_LOGS);
    tplStore.clear();
    logStore.clear();
    for (const tpl of templates) {
      if (tpl && typeof tpl.id === 'string' && typeof tpl.digit === 'number') {
        tplStore.put(tpl);
      }
    }
    for (const lg of logs) {
      if (lg && typeof lg.id === 'string') {
        logStore.put(lg);
      }
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return migratedState;
}

export async function resetAllStorage(): Promise<AppStateV1> {
  const defaults = createDefaultState();
  await saveAppState(defaults);
  await clearLearnedTemplates();
  if (!hasIndexedDB()) {
    memoryFallback.logs = [];
    return defaults;
  }
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_LOGS, 'readwrite');
    tx.objectStore(STORE_LOGS).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return defaults;
}
