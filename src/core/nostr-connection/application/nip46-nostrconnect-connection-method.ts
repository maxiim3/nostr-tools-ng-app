import type { ConnectionAttempt } from '../domain/connection-attempt';
import { ConnectionDomainError } from '../domain/connection-errors';
import type { ConnectionMethod, ConnectionRequest } from '../domain/connection-method';
import type { ConnectionMethodId } from '../domain/connection-method-id';
import type { ActiveConnection } from '../domain/active-connection';
import type { Nip46RestoreContext } from './nip46-restore-context-store';
import { restoreNdkNip46SignerFromPayload } from '../infrastructure/ndk-nip46-restore';
import type { Nip46NostrconnectStarter } from '../infrastructure/nip46-nostrconnect-starter';
import type { Nip46RemoteSigner } from '../infrastructure/nip46-nostrconnect-starter';
import {
  createNip46ActiveConnectionFromRemoteSigner,
  createNip46ConnectionAttempt,
} from './nip46-connection-attempt';

interface Nip46NostrconnectConnectionMethodOptions {
  restoreRemoteSigner?: typeof restoreNdkNip46SignerFromPayload;
  restoreConnectTimeoutMs?: number;
  restoreReadyTimeoutMs?: number;
}

export class Nip46NostrconnectConnectionMethod implements ConnectionMethod {
  readonly id: ConnectionMethodId = 'nip46-nostrconnect';

  private readonly restoreRemoteSigner: typeof restoreNdkNip46SignerFromPayload;
  private readonly restoreConnectTimeoutMs: number;
  private readonly restoreReadyTimeoutMs: number;

  constructor(
    private readonly starter: Nip46NostrconnectStarter,
    options: Nip46NostrconnectConnectionMethodOptions = {}
  ) {
    this.restoreRemoteSigner = options.restoreRemoteSigner ?? restoreNdkNip46SignerFromPayload;
    this.restoreConnectTimeoutMs = options.restoreConnectTimeoutMs ?? 2000;
    this.restoreReadyTimeoutMs = options.restoreReadyTimeoutMs ?? 8000;
  }

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

  async restoreActiveConnection(context: Nip46RestoreContext): Promise<ActiveConnection> {
    let remoteSigner: Nip46RemoteSigner | null = null;
    let connectionOwnsRemoteSigner = false;

    try {
      remoteSigner = await this.restoreRemoteSigner(context.restorePayload, {
        relayUrls: context.relayUrls,
        connectTimeoutMs: this.restoreConnectTimeoutMs,
        readyTimeoutMs: this.restoreReadyTimeoutMs,
      });
      const connection = await withActiveConnectionTimeout(
        createNip46ActiveConnectionFromRemoteSigner(
          remoteSigner,
          [
            'sign-event',
            'nip98-auth',
            'nip04-encrypt',
            'nip04-decrypt',
            'nip44-encrypt',
            'nip44-decrypt',
          ],
          this.id
        ),
        this.restoreReadyTimeoutMs
      );
      connectionOwnsRemoteSigner = true;

      if (connection.getSession().pubkeyHex !== context.pubkeyHex) {
        await connection.disconnect().catch(() => undefined);
        throw new ConnectionDomainError(
          'validation_failed',
          'Restored NIP-46 signer returned a different user pubkey.'
        );
      }

      return connection;
    } catch (error) {
      if (!connectionOwnsRemoteSigner) {
        remoteSigner?.stop();
      }
      throw error;
    }
  }
}

async function withActiveConnectionTimeout(
  promise: Promise<ActiveConnection>,
  timeoutMs: number
): Promise<ActiveConnection> {
  return new Promise<ActiveConnection>((resolve, reject) => {
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      reject(new ConnectionDomainError('timeout', 'NIP-46 connection timed out.'));
    }, timeoutMs);

    void promise.then(
      (connection) => {
        clearTimeout(timeout);
        if (timedOut) {
          void connection.disconnect().catch(() => undefined);
          return;
        }

        resolve(connection);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}
