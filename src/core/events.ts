import type { MascotMood, SceneId } from './types';

export interface AppEvents {
  'scene:change': { scene: SceneId };
  'mascot:mood': { mood: MascotMood };
  'template:learned': { digit: number };
}

type Listener<K extends keyof AppEvents> = (payload: AppEvents[K]) => void;

class EventBus {
  private listeners = new Map<keyof AppEvents, Set<Listener<any>>>();

  on<K extends keyof AppEvents>(event: K, fn: Listener<K>): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(fn);
    this.listeners.set(event, set);
    return () => {
      set.delete(fn);
    };
  }

  emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of set) {
      fn(payload);
    }
  }
}

export const appEvents = new EventBus();
