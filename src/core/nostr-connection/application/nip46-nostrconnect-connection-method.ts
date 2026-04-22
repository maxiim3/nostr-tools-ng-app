import type { ConnectionAttempt } from '../domain/connection-attempt';
import { ConnectionDomainError } from '../domain/connection-errors';
import type { ConnectionMethod, ConnectionRequest } from '../domain/connection-method';
import type { ConnectionMethodId } from '../domain/connection-method-id';
import type { Nip46NostrconnectStarter } from '../infrastructure/nip46-nostrconnect-starter';
import { createNip46ConnectionAttempt } from './nip46-connection-attempt';

export class Nip46NostrconnectConnectionMethod implements ConnectionMethod {
  readonly id: ConnectionMethodId = 'nip46-nostrconnect';

  constructor(private readonly starter: Nip46NostrconnectStarter) {}

  async isAvailable(): Promise<boolean> {
    return this.starter.isAvailable();
  }

  async start(_request?: ConnectionRequest): Promise<ConnectionAttempt> {
    if (!(await this.starter.isAvailable())) {
      throw new ConnectionDomainError(
        'method_unavailable',
        'NIP-46 nostrconnect is not available.'
      );
    }

    const handle = await this.starter.start();
    return createNip46ConnectionAttempt(handle, this.id);
  }
}
