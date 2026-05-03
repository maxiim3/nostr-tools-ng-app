import { normalizeHexPublicKey } from '../domain/connection-session';

const RESTORE_KEY = 'nostr.connect.restore.v1';

export interface Nip07RestoreContext {
  readonly version: 1;
  readonly methodId: 'nip07';
  readonly pubkeyHex: string;
  readonly validatedAt: number;
}

interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class Nip07RestoreContextStore {
  load(): Nip07RestoreContext | null {
    const storage = resolveStorage();
    if (!storage) {
      return null;
    }

    const raw = safeGetItem(storage, RESTORE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = parsePayload(raw);
    if (!parsed) {
      safeRemoveItem(storage, RESTORE_KEY);
      return null;
    }

    return parsed;
  }

  save(context: Nip07RestoreContext): void {
    const storage = resolveStorage();
    if (!storage) {
      return;
    }

    const safePayload: Nip07RestoreContext = {
      version: 1,
      methodId: 'nip07',
      pubkeyHex: context.pubkeyHex,
      validatedAt: context.validatedAt,
    };

    safeSetItem(storage, RESTORE_KEY, JSON.stringify(safePayload));
  }

  clear(): void {
    const storage = resolveStorage();
    if (!storage) {
      return;
    }

    safeRemoveItem(storage, RESTORE_KEY);
  }
}

function parsePayload(raw: string): Nip07RestoreContext | null {
  try {
    const payload = JSON.parse(raw) as Record<string, unknown>;
    const methodId = payload['methodId'];
    const version = payload['version'];
    const validatedAt = payload['validatedAt'];
    const pubkeyHex = normalizeHexPublicKey(
      typeof payload['pubkeyHex'] === 'string' ? payload['pubkeyHex'] : null
    );

    if (version !== 1 || methodId !== 'nip07' || !pubkeyHex || typeof validatedAt !== 'number') {
      return null;
    }

    return { version: 1, methodId: 'nip07', pubkeyHex, validatedAt };
  } catch {
    return null;
  }
}

function resolveStorage(): SafeStorage | null {
  try {
    if (typeof globalThis === 'undefined') {
      return null;
    }

    const storage = globalThis.localStorage;
    if (!storage) {
      return null;
    }

    return storage;
  } catch {
    return null;
  }
}

function safeGetItem(storage: SafeStorage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(storage: SafeStorage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    return;
  }
}

function safeRemoveItem(storage: SafeStorage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    return;
  }
}
