import { nip19 } from 'nostr-tools';

import type { ConnectionCapability } from './connection-capability';
import { ConnectionDomainError } from './connection-errors';
import type { ConnectionMethodId } from './connection-method-id';

export interface ConnectionSession {
  pubkeyHex: string;
  npub: string;
  methodId: ConnectionMethodId;
  capabilities: readonly ConnectionCapability[];
  validatedAt: number;
}

export interface CreateConnectionSessionParams {
  pubkeyHex: string;
  methodId: ConnectionMethodId;
  capabilities: readonly ConnectionCapability[];
  validatedAt?: number;
}

export function createConnectionSession(params: CreateConnectionSessionParams): ConnectionSession {
  const pubkeyHex = normalizeHexPublicKey(params.pubkeyHex);
  if (!pubkeyHex) {
    throw new ConnectionDomainError(
      'invalid_pubkey',
      'Connection session requires a valid hex pubkey.'
    );
  }

  return {
    pubkeyHex,
    npub: nip19.npubEncode(pubkeyHex),
    methodId: params.methodId,
    capabilities: uniqueCapabilities(params.capabilities),
    validatedAt: params.validatedAt ?? Date.now(),
  };
}

export function normalizeHexPublicKey(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();
  return /^[0-9a-f]{64}$/.test(normalizedValue) ? normalizedValue : null;
}

export function didConnectionIdentityChange(
  previous: ConnectionSession,
  current: ConnectionSession
): boolean {
  return (
    previous.pubkeyHex !== current.pubkeyHex ||
    previous.methodId !== current.methodId ||
    !sameCapabilities(previous.capabilities, current.capabilities)
  );
}

function uniqueCapabilities(capabilities: readonly ConnectionCapability[]): ConnectionCapability[] {
  const seen = new Set<ConnectionCapability>();

  return capabilities.filter((capability) => {
    if (seen.has(capability)) {
      return false;
    }

    seen.add(capability);
    return true;
  });
}

function sameCapabilities(
  left: readonly ConnectionCapability[],
  right: readonly ConnectionCapability[]
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((capability, index) => capability === right[index]);
}
