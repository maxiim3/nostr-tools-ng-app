import '@angular/compiler';

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import { FrancophonePackMembershipService } from '../../../packs/application/francophone-pack-membership.service';
import {
  StarterPackRequestService,
  type AdminPackMemberEntry,
} from '../../../packs/application/starter-pack-request.service';
import { mergePackMembers, PackAdminRequestsPage } from './pack-admin-requests.page';

const FAKE_ENTRIES: AdminPackMemberEntry[] = [
  {
    pubkey: 'abc123',
    username: 'Alice',
    description: 'Nostr builder',
    avatarUrl: null,
    primalUrl: 'https://primal.net/p/abc123',
    joinedAt: 1000,
    joinedAtLabel: '1 janv. 2024',
    requestedFromApp: true,
    requestedAt: 1000,
    requestedAtLabel: '1 janv. 2024',
    accountCreatedAt: null,
    accountCreatedAtLabel: '-',
    followerCount: null,
    followingCount: null,
    postCount: null,
    zapCount: null,
    canRemove: true,
  },
];

interface PageAccess {
  entries: () => AdminPackMemberEntry[];
  loading: () => boolean;
  actingOn: () => string | null;
  actionError: () => string | null;
  userRequestStatus: () => string | null;
  isPackMember: () => boolean;
  remove: (entry: AdminPackMemberEntry) => Promise<void>;
}

function asAccessible(page: PackAdminRequestsPage): PageAccess {
  return page as unknown as PageAccess;
}

function createMocks() {
  const isAuthenticatedMock = vi.fn().mockReturnValue(true);
  const listAdminRequestsMock = vi.fn().mockResolvedValue(FAKE_ENTRIES);
  const getUserStateMock = vi.fn().mockResolvedValue({ status: 'idle' });
  const removeMemberMock = vi.fn().mockResolvedValue(undefined);
  const isCurrentUserMemberMock = vi.fn().mockResolvedValue(false);
  const listPublicPackMembersMock = vi.fn().mockResolvedValue([]);

  TestBed.configureTestingModule({
    providers: [
      PackAdminRequestsPage,
      {
        provide: NostrSessionService,
        useValue: {
          isAuthenticated: isAuthenticatedMock,
          user: vi.fn().mockReturnValue(null),
        },
      },
      {
        provide: StarterPackRequestService,
        useValue: {
          listAdminRequests: listAdminRequestsMock,
          getUserState: getUserStateMock,
          removeMember: removeMemberMock,
        },
      },
      {
        provide: FrancophonePackMembershipService,
        useValue: {
          isCurrentUserMember: isCurrentUserMemberMock,
          listPublicPackMembers: listPublicPackMembersMock,
        },
      },
    ],
  });

  return {
    isAuthenticated: isAuthenticatedMock,
    listAdminRequests: listAdminRequestsMock,
    getUserState: getUserStateMock,
    removeMember: removeMemberMock,
    isCurrentUserMember: isCurrentUserMemberMock,
    listPublicPackMembers: listPublicPackMembersMock,
  };
}

describe('PackAdminRequestsPage', () => {
  it('loads members and user status on init', async () => {
    const mocks = createMocks();
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();

    expect(mocks.listAdminRequests).toHaveBeenCalled();
    expect(mocks.getUserState).toHaveBeenCalled();
    expect(page.entries()).toEqual(FAKE_ENTRIES);
    expect(page.loading()).toBe(false);
  });

  it('loads public pack members without duplicating Supabase members', async () => {
    const mocks = createMocks();
    mocks.listPublicPackMembers.mockResolvedValue([
      {
        pubkey: 'abc123',
        username: 'Alice from pack',
        description: null,
        avatarUrl: null,
      },
      {
        pubkey: 'def456',
        username: 'Bob',
        description: 'Pack-only member',
        avatarUrl: 'bob.png',
      },
    ]);
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();

    expect(page.entries()).toHaveLength(2);
    expect(page.entries()[0]).toEqual(FAKE_ENTRIES[0]);
    expect(page.entries()[1]).toMatchObject({
      pubkey: 'def456',
      username: 'Bob',
      requestedFromApp: false,
      joinedAtLabel: '-',
      canRemove: false,
    });
  });

  it('skips getUserState when not authenticated', async () => {
    const mocks = createMocks();
    mocks.isAuthenticated.mockReturnValue(false);

    asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();

    expect(mocks.getUserState).not.toHaveBeenCalled();
  });

  it('remove calls removeMember and reloads', async () => {
    const mocks = createMocks();
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();
    mocks.listAdminRequests.mockClear();
    mocks.removeMember.mockClear();

    await page.remove(FAKE_ENTRIES[0]);

    expect(mocks.removeMember).toHaveBeenCalledWith('abc123');
    expect(mocks.listAdminRequests).toHaveBeenCalled();
    expect(page.actingOn()).toBeNull();
    expect(page.actionError()).toBeNull();
  });

  it('remove sets actionError on failure', async () => {
    const mocks = createMocks();
    mocks.removeMember.mockRejectedValue(new Error('fail'));
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();

    await page.remove(FAKE_ENTRIES[0]);

    expect(page.actionError()).toBe('adminRequests.errors.removeFailed');
    expect(page.actingOn()).toBeNull();
  });
});

describe('mergePackMembers', () => {
  it('keeps the Supabase record when a public pack member has the same pubkey', () => {
    const result = mergePackMembers(FAKE_ENTRIES, [
      {
        pubkey: 'abc123',
        username: 'Public Alice',
        description: null,
        avatarUrl: null,
      },
    ]);

    expect(result).toEqual(FAKE_ENTRIES);
  });
});
