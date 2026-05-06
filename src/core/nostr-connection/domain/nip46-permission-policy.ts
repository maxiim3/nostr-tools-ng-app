import type { ConnectionCapability } from './connection-capability';

export const NIP46_MINIMUM_STARTUP_PERMS = ['get_public_key', 'sign_event'] as const;

export const NIP46_MINIMUM_CAPABILITIES: readonly ConnectionCapability[] = [
  'sign-event',
  'nip98-auth',
];

export const NIP46_MINIMUM_STARTUP_PERMS_STRING = NIP46_MINIMUM_STARTUP_PERMS.join(',');
