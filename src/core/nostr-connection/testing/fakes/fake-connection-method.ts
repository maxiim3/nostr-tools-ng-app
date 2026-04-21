import type { ConnectionRequest } from '../../domain/connection-method';
import type { ConnectionAttempt } from '../../domain/connection-attempt';
import { ConnectionDomainError } from '../../domain/connection-errors';
import type { ConnectionMethod } from '../../domain/connection-method';
import type { ConnectionMethodId } from '../../domain/connection-method-id';
import type { ActiveConnection } from '../../domain/active-connection';
import { FakeActiveConnection } from './fake-active-connection';
import { FakeConnectionAttempt } from './fake-connection-attempt';

export interface FakeConnectionMethodOptions {
  id?: ConnectionMethodId;
  available?: boolean;
  startError?: Error;
  completeError?: Error;
  connection?: ActiveConnection;
  attempt?: ConnectionAttempt;
}

export class FakeConnectionMethod implements ConnectionMethod {
  readonly id: ConnectionMethodId;

  isAvailableCalls = 0;
  startCalls = 0;
  lastRequest: ConnectionRequest | undefined;

  private readonly available: boolean;
  private readonly startError?: Error;
  private readonly attempt: ConnectionAttempt;

  constructor(options: FakeConnectionMethodOptions = {}) {
    this.id = options.id ?? 'nip07';
    this.available = options.available ?? true;
    this.startError = options.startError;

    const connection = options.connection ?? new FakeActiveConnection({ methodId: this.id });
    this.attempt =
      options.attempt ??
      new FakeConnectionAttempt(this.id, {
        methodId: this.id,
        connection,
        completeError: options.completeError,
      });
  }

  async isAvailable(): Promise<boolean> {
    this.isAvailableCalls += 1;
    return this.available;
  }

  async start(request?: ConnectionRequest): Promise<ConnectionAttempt> {
    this.startCalls += 1;
    this.lastRequest = request;

    if (!this.available) {
      throw new ConnectionDomainError(
        'method_unavailable',
        `Connection method ${this.id} is not available.`
      );
    }

    if (this.startError) {
      throw this.startError;
    }

    return this.attempt;
  }
}
