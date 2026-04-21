import type { ConnectionAttempt } from './connection-attempt';
import type { ConnectionMethodId } from './connection-method-id';

export type ConnectionReason = 'interactive-login' | 'background-restore' | 'sensitive-action';

export interface ConnectionRequest {
  readonly reason: ConnectionReason;
}

export interface ConnectionMethod {
  readonly id: ConnectionMethodId;

  isAvailable(): Promise<boolean>;
  start(request?: ConnectionRequest): Promise<ConnectionAttempt>;
}
