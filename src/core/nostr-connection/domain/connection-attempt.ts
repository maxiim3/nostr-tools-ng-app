import type { ActiveConnection } from './active-connection';
import type { ConnectionMethodId } from './connection-method-id';

export interface ConnectionAttemptInstructions {
  launchUrl?: string;
  copyValue?: string;
  qrCodeValue?: string;
  authUrl?: string;
}

export interface ConnectionAttempt {
  readonly methodId: ConnectionMethodId;
  readonly instructions: ConnectionAttemptInstructions | null;

  onInstructionsChange(
    listener: (instructions: ConnectionAttemptInstructions | null) => void
  ): () => void;
  complete(): Promise<ActiveConnection>;
  cancel(): Promise<void>;
}
