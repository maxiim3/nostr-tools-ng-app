import '@angular/compiler';

import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    isStored: true,
    canRemove: true,
  },
];

interface PageAccess {
  entries: () => AdminPackMemberEntry[];
  loading: () => boolean;
  actingOn: () => string | null;
  confirmingRemovalPubkey: () => string | null;
  actionError: () => string | null;
  loadWarnings: () => string[];
  toggleSort: (field: 'username' | 'accountCreatedAt' | 'requestedFromApp' | 'joinedAt') => void;
  sortIndicator: (
    field: 'username' | 'accountCreatedAt' | 'requestedFromApp' | 'joinedAt'
  ) => string;
  sortedEntries: () => AdminPackMemberEntry[];
  remove: (entry: AdminPackMemberEntry) => Promise<void>;
}

function asAccessible(page: PackAdminRequestsPage): PageAccess {
  return page as unknown as PageAccess;
}

function createMocks() {
  const listAdminRequestsMock = vi.fn().mockResolvedValue(FAKE_ENTRIES);
  const removeMemberMock = vi.fn().mockResolvedValue(undefined);
  const listPublicPackMembersMock = vi.fn().mockResolvedValue([]);
  const removeMemberFromPackMock = vi.fn().mockResolvedValue(undefined);

  TestBed.configureTestingModule({
    providers: [
      PackAdminRequestsPage,
      {
        provide: StarterPackRequestService,
        useValue: {
          listAdminRequests: listAdminRequestsMock,
          removeMember: removeMemberMock,
        },
      },
      {
        provide: FrancophonePackMembershipService,
        useValue: {
          listPublicPackMembers: listPublicPackMembersMock,
          removeMemberFromPack: removeMemberFromPackMock,
        },
      },
    ],
  });

  return {
    listAdminRequests: listAdminRequestsMock,
    removeMember: removeMemberMock,
    listPublicPackMembers: listPublicPackMembersMock,
    removeMemberFromPack: removeMemberFromPackMock,
  };
}

describe('PackAdminRequestsPage', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('loads members and user status on init', async () => {
    const mocks = createMocks();
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();

    expect(mocks.listAdminRequests).toHaveBeenCalled();
    expect(page.entries()).toEqual(FAKE_ENTRIES);
    expect(page.loadWarnings()).toEqual([]);
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
      isStored: false,
      canRemove: true,
    });
  });

  it('keeps stored members visible when public members loading fails', async () => {
    const mocks = createMocks();
    mocks.listPublicPackMembers.mockRejectedValue(new Error('public failed'));

    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();

    expect(page.entries()).toEqual(FAKE_ENTRIES);
    expect(page.loadWarnings()).toEqual(['adminRequests.warnings.publicSourceUnavailable']);
  });

  it('keeps public members visible when the admin source fails', async () => {
    const mocks = createMocks();
    mocks.listAdminRequests.mockRejectedValue(new Error('admin failed'));
    mocks.listPublicPackMembers.mockResolvedValue([
      {
        pubkey: 'def456',
        username: 'Bob',
        description: 'Pack-only member',
        avatarUrl: 'bob.png',
      },
    ]);

    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();

    expect(page.entries()).toHaveLength(1);
    expect(page.entries()[0]).toMatchObject({
      pubkey: 'def456',
      username: 'Bob',
      canRemove: true,
    });
    expect(page.loadWarnings()).toEqual(['adminRequests.warnings.adminSourceUnavailable']);
  });

  it('remove asks for confirmation before executing', async () => {
    const mocks = createMocks();
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();

    await page.remove(FAKE_ENTRIES[0]);

    expect(page.confirmingRemovalPubkey()).toBe('abc123');
    expect(mocks.removeMemberFromPack).not.toHaveBeenCalled();
    expect(mocks.removeMember).not.toHaveBeenCalled();
  });

  it('clears the confirmation state after 3 seconds', async () => {
    vi.useFakeTimers();
    const mocks = createMocks();
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();

    await page.remove(FAKE_ENTRIES[0]);
    expect(page.confirmingRemovalPubkey()).toBe('abc123');

    await vi.advanceTimersByTimeAsync(3000);

    expect(page.confirmingRemovalPubkey()).toBeNull();
    expect(mocks.removeMemberFromPack).not.toHaveBeenCalled();
  });

  it('remove updates the pack and then removes the DB record when confirmed', async () => {
    const mocks = createMocks();
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();
    mocks.listAdminRequests.mockClear();
    mocks.removeMember.mockClear();
    mocks.removeMemberFromPack.mockClear();

    await page.remove(FAKE_ENTRIES[0]);
    await page.remove(FAKE_ENTRIES[0]);

    expect(mocks.removeMemberFromPack).toHaveBeenCalledWith('abc123');
    expect(mocks.removeMember).toHaveBeenCalledWith('abc123');
    expect(mocks.listAdminRequests).toHaveBeenCalled();
    expect(page.confirmingRemovalPubkey()).toBeNull();
    expect(page.actingOn()).toBeNull();
    expect(page.actionError()).toBeNull();
  });

  it('remove only updates the pack when the member is not in DB', async () => {
    const mocks = createMocks();
    mocks.listPublicPackMembers.mockResolvedValue([
      {
        pubkey: 'def456',
        username: 'Bob',
        description: 'Pack-only member',
        avatarUrl: 'bob.png',
      },
    ]);
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();
    mocks.removeMember.mockClear();
    mocks.removeMemberFromPack.mockClear();

    const packOnlyEntry = page.entries()[1];
    await page.remove(packOnlyEntry);
    await page.remove(packOnlyEntry);

    expect(mocks.removeMemberFromPack).toHaveBeenCalledWith('def456');
    expect(mocks.removeMember).not.toHaveBeenCalled();
  });

  it('remove sets actionError on failure', async () => {
    const mocks = createMocks();
    mocks.removeMemberFromPack.mockRejectedValue(new Error('fail'));
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();

    await page.remove(FAKE_ENTRIES[0]);
    await page.remove(FAKE_ENTRIES[0]);

    expect(page.actionError()).toBe('adminRequests.errors.removeFailed');
    expect(page.actingOn()).toBeNull();
  });

  it('cycles username sort from current to asc to desc to current', async () => {
    const mocks = createMocks();
    mocks.listAdminRequests.mockResolvedValue([
      FAKE_ENTRIES[0],
      {
        ...FAKE_ENTRIES[0],
        pubkey: 'zzz999',
        username: 'Aaron',
        joinedAt: 1,
        joinedAtLabel: '-',
        requestedFromApp: false,
        isStored: false,
      },
    ]);
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();

    expect(page.sortIndicator('username')).toBe('');
    expect(page.sortedEntries().map((entry) => entry.username)).toEqual(['Alice', 'Aaron']);

    page.toggleSort('username');
    expect(page.sortIndicator('username')).toBe('↑');
    expect(page.sortedEntries().map((entry) => entry.username)).toEqual(['Aaron', 'Alice']);

    page.toggleSort('username');
    expect(page.sortIndicator('username')).toBe('↓');
    expect(page.sortedEntries().map((entry) => entry.username)).toEqual(['Alice', 'Aaron']);

    page.toggleSort('username');
    expect(page.sortIndicator('username')).toBe('');
    expect(page.sortedEntries().map((entry) => entry.username)).toEqual(['Alice', 'Aaron']);
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
