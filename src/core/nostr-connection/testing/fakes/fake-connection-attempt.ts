import type {
  ConnectionAttempt,
  ConnectionAttemptInstructions,
} from '../../domain/connection-attempt';
import type { ActiveConnection } from '../../domain/active-connection';
import type { ConnectionMethodId } from '../../domain/connection-method-id';

export interface FakeConnectionAttemptOptions {
  methodId: ConnectionMethodId;
  connection: ActiveConnection;
  instructions?: ConnectionAttemptInstructions | null;
  completeError?: Error;
}

export class FakeConnectionAttempt implements ConnectionAttempt {
  readonly instructions: ConnectionAttemptInstructions | null;

  cancelCalls = 0;
  completeCalls = 0;

  private readonly connection: ActiveConnection;
  private readonly completeError?: Error;

  constructor(
    readonly methodId: ConnectionMethodId,
    options: FakeConnectionAttemptOptions
  ) {
    this.instructions = options.instructions ?? null;
    this.connection = options.connection;
    this.completeError = options.completeError;
  }

  async complete(): Promise<ActiveConnection> {
    this.completeCalls += 1;

    if (this.completeError) {
      throw this.completeError;
    }

    return this.connection;
  }

  onInstructionsChange(): () => void {
    return () => undefined;
  }

  async cancel(): Promise<void> {
    this.cancelCalls += 1;
  }
}
