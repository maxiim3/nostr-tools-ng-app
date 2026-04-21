import type { Nip46BunkerStarter } from '../../infrastructure/nip46-bunker-starter';
import type { Nip46AttemptHandle } from '../../infrastructure/nip46-nostrconnect-starter';
import { FakeNip46AttemptHandle } from './fake-nip46-nostrconnect-starter';

export interface FakeNip46BunkerStarterOptions {
  available?: boolean;
  startError?: Error;
  attempt?: Nip46AttemptHandle;
}

export class FakeNip46BunkerStarter implements Nip46BunkerStarter {
  isAvailableCalls = 0;
  startCalls = 0;
  lastConnectionToken: string | null = null;

  private readonly available: boolean;
  private readonly startError?: Error;
  private readonly attempt: Nip46AttemptHandle;

  constructor(options: FakeNip46BunkerStarterOptions = {}) {
    this.available = options.available ?? true;
    this.startError = options.startError;
    this.attempt = options.attempt ?? new FakeNip46AttemptHandle({ uri: 'bunker://example' });
  }

  async isAvailable(): Promise<boolean> {
    this.isAvailableCalls += 1;
    return this.available;
  }

  async start(connectionToken: string): Promise<Nip46AttemptHandle> {
    this.startCalls += 1;
    this.lastConnectionToken = connectionToken;

    if (this.startError) {
      throw this.startError;
    }

    return this.attempt;
  }
}
