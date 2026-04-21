import '@angular/compiler';

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import { FrancophonePackMembershipService } from '../../../packs/application/francophone-pack-membership.service';
import { FrancophonePackNotificationService } from '../../../packs/application/francophone-pack-notification.service';
import { StarterPackRequestService, type AdminRequestEntry } from '../../../packs/application/starter-pack-request.service';
import { PackAdminRequestsPage } from './pack-admin-requests.page';

const FAKE_ENTRIES: AdminRequestEntry[] = [
  {
    requesterPubkey: 'abc123',
    requesterNpub: 'npub1abc',
    displayName: 'Alice',
    imageUrl: null,
    primalUrl: 'https://primal.net/p/npub1abc',
    submittedAt: 1000,
    submittedAtLabel: '1 janv. 2024',
    status: 'pending',
  },
];

type PageAccess = {
  entries: () => AdminRequestEntry[];
  loading: () => boolean;
  actingOn: () => string | null;
  actionError: () => string | null;
  userRequestStatus: () => string | null;
  isPackMember: () => boolean;
  approve: (entry: AdminRequestEntry) => Promise<void>;
  reject: (entry: AdminRequestEntry) => Promise<void>;
};

function asAccessible(page: PackAdminRequestsPage): PageAccess {
  return page as unknown as PageAccess;
}

function createMocks() {
  const isAuthenticatedMock = vi.fn().mockReturnValue(true);
  const listAdminRequestsMock = vi.fn().mockResolvedValue(FAKE_ENTRIES);
  const getUserStateMock = vi.fn().mockResolvedValue({ status: 'idle' });
  const approveRequestMock = vi.fn().mockResolvedValue(undefined);
  const rejectRequestMock = vi.fn().mockResolvedValue(undefined);
  const isCurrentUserMemberMock = vi.fn().mockResolvedValue(false);
  const addMemberMock = vi.fn().mockResolvedValue(undefined);
  const sendApprovalDirectMessageMock = vi.fn().mockResolvedValue(undefined);

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
          approveRequest: approveRequestMock,
          rejectRequest: rejectRequestMock,
        },
      },
      {
        provide: FrancophonePackMembershipService,
        useValue: {
          isCurrentUserMember: isCurrentUserMemberMock,
          addMember: addMemberMock,
        },
      },
      {
        provide: FrancophonePackNotificationService,
        useValue: {
          sendApprovalDirectMessage: sendApprovalDirectMessageMock,
        },
      },
    ],
  });

  return {
    isAuthenticated: isAuthenticatedMock,
    listAdminRequests: listAdminRequestsMock,
    getUserState: getUserStateMock,
    approveRequest: approveRequestMock,
    rejectRequest: rejectRequestMock,
    isCurrentUserMember: isCurrentUserMemberMock,
    addMember: addMemberMock,
    sendApprovalDirectMessage: sendApprovalDirectMessageMock,
  };
}

describe('PackAdminRequestsPage', () => {
  it('loads requests and user status on init', async () => {
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

  it('approve calls addMember, sendApprovalDirectMessage, approveRequest and reloads', async () => {
    const mocks = createMocks();
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();
    mocks.listAdminRequests.mockClear();
    mocks.addMember.mockClear();
    mocks.sendApprovalDirectMessage.mockClear();
    mocks.approveRequest.mockClear();

    await page.approve(FAKE_ENTRIES[0]);

    expect(mocks.addMember).toHaveBeenCalledWith('abc123');
    expect(mocks.sendApprovalDirectMessage).toHaveBeenCalledWith('abc123');
    expect(mocks.approveRequest).toHaveBeenCalledWith('abc123');
    expect(mocks.listAdminRequests).toHaveBeenCalled();
    expect(page.actingOn()).toBeNull();
    expect(page.actionError()).toBeNull();
  });

  it('approve sets actionError on failure', async () => {
    const mocks = createMocks();
    mocks.addMember.mockRejectedValue(new Error('fail'));
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();

    await page.approve(FAKE_ENTRIES[0]);

    expect(page.actionError()).toBe('adminRequests.errors.approveFailed');
    expect(page.actingOn()).toBeNull();
  });

  it('reject calls rejectRequest and reloads', async () => {
    const mocks = createMocks();
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();
    mocks.listAdminRequests.mockClear();
    mocks.rejectRequest.mockClear();

    await page.reject(FAKE_ENTRIES[0]);

    expect(mocks.rejectRequest).toHaveBeenCalledWith('abc123');
    expect(mocks.listAdminRequests).toHaveBeenCalled();
    expect(page.actingOn()).toBeNull();
    expect(page.actionError()).toBeNull();
  });

  it('reject sets actionError on failure', async () => {
    const mocks = createMocks();
    mocks.rejectRequest.mockRejectedValue(new Error('fail'));
    const page = asAccessible(TestBed.inject(PackAdminRequestsPage));

    await vi.dynamicImportSettled();

    await page.reject(FAKE_ENTRIES[0]);

    expect(page.actionError()).toBe('adminRequests.errors.rejectFailed');
    expect(page.actingOn()).toBeNull();
  });
});