import { TestBed } from '@angular/core/testing';

import { NostrClientService, type SessionUser } from './nostr-client.service';
import { NostrSessionService } from './nostr-session.service';
import { FollowService } from './follow.service';

const OWNER_PUBKEY = '15a1989c2c483f6c6f18f2dda1033897a003669f449fc2fda4fa2fb6c9210900';

describe('FollowService', () => {
  const sessionUser: SessionUser = {
    pubkey: 'a'.repeat(64),
    npub: 'npub1testaccount',
    displayName: 'Test User',
    imageUrl: null,
    description: null,
    nip05: null,
  };

  let client: ReturnType<typeof createClientMock>;
  let session: NostrSessionService;

  beforeEach(() => {
    client = createClientMock();
    session = createSessionMock(sessionUser);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('throws when no user is authenticated', async () => {
    const noUserSession = createSessionMock(null);
    const service = createService(client, noUserSession);

    await expect(service.followOwner()).rejects.toThrow('Authentication required to follow.');
  });

  it('publishes a follow event when not already following', async () => {
    client.fetchEvents.mockResolvedValue([
      {
        tags: [['p', 'someotherpubkey', 'wss://relay.example.com', 'SomeRelay']],
        content: '',
        created_at: 1,
      } as any,
    ]);
    client.publishEvent.mockResolvedValue('event-id');

    const service = createService(client, session);

    await service.followOwner();

    expect(client.fetchEvents).toHaveBeenCalledWith({
      kinds: [3],
      authors: [sessionUser.pubkey],
      limit: 1,
    });
    expect(client.publishEvent).toHaveBeenCalledWith(
      3,
      [
        ['p', 'someotherpubkey', 'wss://relay.example.com', 'SomeRelay'],
        ['p', OWNER_PUBKEY, 'wss://relay.damus.io', 'ToolStr'],
      ],
      ''
    );
  });

  it('skips publishing when already following owner', async () => {
    client.fetchEvents.mockResolvedValue([
      {
        tags: [['p', OWNER_PUBKEY, 'wss://relay.damus.io', 'ToolStr']],
        content: 'existing-content',
        created_at: 1,
      } as any,
    ]);

    const service = createService(client, session);

    await service.followOwner();

    expect(client.publishEvent).not.toHaveBeenCalled();
  });

  it('publishes with empty tags when no existing contact list event', async () => {
    client.fetchEvents.mockResolvedValue([]);
    client.publishEvent.mockResolvedValue('event-id');

    const service = createService(client, session);

    await service.followOwner();

    expect(client.publishEvent).toHaveBeenCalledWith(
      3,
      [['p', OWNER_PUBKEY, 'wss://relay.damus.io', 'ToolStr']],
      ''
    );
  });
});

function createService(client: NostrClientMock, session: NostrSessionService): FollowService {
  TestBed.configureTestingModule({
    providers: [
      { provide: NostrClientService, useValue: client },
      { provide: NostrSessionService, useValue: session },
    ],
  });

  return TestBed.inject(FollowService);
}

function createSessionMock(user: SessionUser | null): NostrSessionService {
  return { user: vi.fn().mockReturnValue(user) } as unknown as NostrSessionService;
}

type NostrClientMock = Pick<NostrClientService, 'fetchEvents' | 'publishEvent'>;

function createClientMock() {
  return {
    fetchEvents: vi.fn<(filters: any) => Promise<any[]>>(),
    publishEvent: vi.fn<(kind: number, tags: string[][], content: unknown) => Promise<string>>(),
  } satisfies NostrClientMock;
}
