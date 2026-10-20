import { LEVEL01 } from '../level/level01Layout.ts';

export const SAVE_KEY = 'chumbala.save.v1';
export interface SaveData {
  readonly schemaVersion: 1;
  readonly tutorial: { readonly giveLearned: boolean };
  readonly progress: {
    readonly currentLevel: typeof LEVEL01.id;
    readonly checkpointId: typeof LEVEL01.ofrenda.checkpoint.id | null;
    readonly levelCompleted: boolean;
  };
}
export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Runtime validation is required: JSON and browser storage are untrusted inputs.
function decode(value: unknown): SaveData | null {
  if (!record(value) || value.schemaVersion !== 1 || !record(value.tutorial) || !record(value.progress)) return null;
  const tutorial = value.tutorial;
  const progress = value.progress;
  if (typeof tutorial.giveLearned !== 'boolean' || progress.currentLevel !== LEVEL01.id
    || typeof progress.levelCompleted !== 'boolean'
    || (progress.checkpointId !== null && progress.checkpointId !== LEVEL01.ofrenda.checkpoint.id)) return null;
  if ((progress.checkpointId !== null && !tutorial.giveLearned)
    || (progress.levelCompleted && progress.checkpointId === null)) return null;
  // Copy only schema fields. Never retain arbitrary properties from parsed JSON.
  return { schemaVersion: 1, tutorial: { giveLearned: tutorial.giveLearned },
    progress: { currentLevel: progress.currentLevel, checkpointId: progress.checkpointId,
      levelCompleted: progress.levelCompleted } };
}

export class SaveSystem {
  private readonly storage: () => SaveStorage;

  constructor(storage: () => SaveStorage = () => window.localStorage) { this.storage = storage; }

  load(): SaveData | null {
    try {
      const raw = this.storage().getItem(SAVE_KEY);
      return raw === null ? null : decode(JSON.parse(raw));
    } catch { return null; }
  }

  write(data: SaveData): boolean {
    const valid = decode(data);
    if (!valid) return false;
    try {
      const storage = this.storage();
      const json = JSON.stringify(valid);
      if (storage.getItem(SAVE_KEY) !== json) storage.setItem(SAVE_KEY, json);
      return true;
    } catch { return false; }
  }

  learnGive(): boolean {
    const previous = this.load();
    return this.write({ schemaVersion: 1, tutorial: { giveLearned: true },
      progress: previous?.progress ?? { currentLevel: LEVEL01.id, checkpointId: null, levelCompleted: false } });
  }

  saveOfrenda(levelCompleted: boolean): boolean {
    return this.write({ schemaVersion: 1, tutorial: { giveLearned: true }, progress: {
      currentLevel: LEVEL01.id, checkpointId: LEVEL01.ofrenda.checkpoint.id, levelCompleted,
    } });
  }
}
