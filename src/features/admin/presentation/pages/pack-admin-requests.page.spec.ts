import '@angular/compiler';

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import { FrancophonePackMembershipService } from '../../../packs/application/francophone-pack-membership.service';
import {
  StarterPackRequestService,
  type AdminPackMemberEntry,
} from '../../../packs/application/starter-pack-request.service';
import { PackAdminRequestsPage } from './pack-admin-requests.page';

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
