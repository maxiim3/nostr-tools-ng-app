import { TestBed } from '@angular/core/testing';
import { unpackEventFromToken, validateEvent as validateNip98Event } from 'nostr-tools/nip98';

import { NostrConnectionFacadeService } from '../../nostr-connection/application/connection-facade';
import type { ActiveConnection } from '../../nostr-connection/domain/active-connection';
import type { ConnectionMethodId } from '../../nostr-connection/domain/connection-method-id';
import type { ConnectionSession } from '../../nostr-connection/domain/connection-session';
import type { ConnectionSigner } from '../../nostr-connection/domain/connection-signer';
import { FakeConnectionSigner } from '../../nostr-connection/testing/fakes/fake-connection-signer';
import { NostrClientService } from './nostr-client.service';
import { NostrHttpAuthService } from './nostr-http-auth.service';

describe('NostrHttpAuthService', () => {
  let service: NostrHttpAuthService;
  let getActiveConnectionMock: ReturnType<typeof vi.fn>;
  let getHttpAuthSignerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getActiveConnectionMock = vi.fn();
    getHttpAuthSignerMock = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        NostrHttpAuthService,
        {
          provide: NostrConnectionFacadeService,
          useValue: { getActiveConnection: getActiveConnectionMock },
        },
        { provide: NostrClientService, useValue: { getHttpAuthSigner: getHttpAuthSignerMock } },
      ],
    });

    service = TestBed.inject(NostrHttpAuthService);
  });

  it('uses the active connection signer when it supports NIP-98', async () => {
    const activeSigner = new FakeConnectionSigner();
    getActiveConnectionMock.mockReturnValue(createActiveConnection(activeSigner));
    getHttpAuthSignerMock.mockResolvedValue(new FakeConnectionSigner());

    const header = await service.createAuthorizationHeader({
      url: 'https://example.com/api/pack-requests',
      method: 'GET',
    });

    expect(getHttpAuthSignerMock).not.toHaveBeenCalled();
    await expect(
      isValidNip98Header(header, 'https://example.com/api/pack-requests', 'GET')
    ).resolves.toBe(true);
  });

  it('falls back to client signer when no active connection exists', async () => {
    const fallbackSigner = new FakeConnectionSigner();
    getActiveConnectionMock.mockReturnValue(null);
    getHttpAuthSignerMock.mockResolvedValue(fallbackSigner);

    const header = await service.createAuthorizationHeader({
      url: 'https://example.com/api/pack-requests',
      method: 'POST',
      body: { hello: 'world' },
    });

    expect(getHttpAuthSignerMock).toHaveBeenCalledTimes(1);
    await expect(
      isValidNip98Header(header, 'https://example.com/api/pack-requests', 'POST', {
        hello: 'world',
      })
    ).resolves.toBe(true);
  });

  it('falls back to client signer when active signer lacks NIP-98 capability', async () => {
    const limitedSigner = new FakeConnectionSigner({ capabilities: ['sign-event'] });
    const fallbackSigner = new FakeConnectionSigner();
    getActiveConnectionMock.mockReturnValue(createActiveConnection(limitedSigner));
    getHttpAuthSignerMock.mockResolvedValue(fallbackSigner);

    const header = await service.createAuthorizationHeader({
      url: 'https://example.com/api/admin/pack-requests',
      method: 'GET',
    });

    expect(getHttpAuthSignerMock).toHaveBeenCalledTimes(1);
    await expect(
      isValidNip98Header(header, 'https://example.com/api/admin/pack-requests', 'GET')
    ).resolves.toBe(true);
  });
});

function createActiveConnection(
  signer: ConnectionSigner & { publicKeyHex: string }
): ActiveConnection {
  const session = createSession(signer.publicKeyHex, 'nip07');

  return {
    methodId: 'nip07',
    signer,
    getSession: () => session,
    revalidate: async () => ({
      previous: session,
      current: session,
      changed: false,
    }),
    disconnect: async () => undefined,
  };
}

function createSession(pubkeyHex: string, methodId: ConnectionMethodId): ConnectionSession {
  return {
    methodId,
    pubkeyHex,
    npub: `npub1${pubkeyHex.slice(0, 10)}`,
    capabilities: ['sign-event'],
    validatedAt: Date.now(),
  };
}

async function isValidNip98Header(
  header: string,
  url: string,
  method: string,
  payload?: unknown
): Promise<boolean> {
  const event = await unpackEventFromToken(header);
  return Boolean(await validateNip98Event(event, url, method, payload));
}
