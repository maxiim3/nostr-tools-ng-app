import { normalizeHexPublicKey } from '../domain/connection-session';

const RESTORE_KEY = 'nostr.connect.nip46.restore.v1';

export interface Nip46RestoreContext {
  readonly version: 1;
  readonly methodId: 'nip46-nostrconnect';
  readonly restorePayload: string;
  readonly pubkeyHex: string;
  readonly validatedAt: number;
  readonly relayUrls?: readonly string[];
  readonly permissions?: readonly string[];
}

interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class Nip46RestoreContextStore {
  load(): Nip46RestoreContext | null {
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

  save(context: Nip46RestoreContext): void {
    const storage = resolveStorage();
    if (!storage) {
      return;
    }

    const pubkeyHex = normalizeHexPublicKey(context.pubkeyHex);
    if (!pubkeyHex || context.restorePayload.length === 0) {
      return;
    }

    const safePayload: Nip46RestoreContext = {
      version: 1,
      methodId: 'nip46-nostrconnect',
      restorePayload: context.restorePayload,
      pubkeyHex,
      validatedAt: context.validatedAt,
      ...(context.relayUrls ? { relayUrls: [...context.relayUrls] } : {}),
      ...(context.permissions ? { permissions: [...context.permissions] } : {}),
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

function parsePayload(raw: string): Nip46RestoreContext | null {
  try {
    const payload = JSON.parse(raw) as Record<string, unknown>;
    const version = payload['version'];
    const methodId = payload['methodId'];
    const restorePayload = payload['restorePayload'];
    const validatedAt = payload['validatedAt'];
    const pubkeyHex = normalizeHexPublicKey(
      typeof payload['pubkeyHex'] === 'string' ? payload['pubkeyHex'] : null
    );

    if (
      version !== 1 ||
      methodId !== 'nip46-nostrconnect' ||
      typeof restorePayload !== 'string' ||
      restorePayload.length === 0 ||
      !pubkeyHex ||
      typeof validatedAt !== 'number'
    ) {
      return null;
    }

    const relayUrls = parseStringArray(payload['relayUrls']);
    const permissions = parseStringArray(payload['permissions']);

    if (relayUrls === null || permissions === null) {
      return null;
    }

    return {
      version: 1,
      methodId: 'nip46-nostrconnect',
      restorePayload,
      pubkeyHex,
      validatedAt,
      ...(relayUrls ? { relayUrls } : {}),
      ...(permissions ? { permissions } : {}),
    };
  } catch {
    return null;
  }
}

function parseStringArray(value: unknown): readonly string[] | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    return null;
  }

  return value;
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
