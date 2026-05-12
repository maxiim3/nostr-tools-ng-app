import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import { PackManagerService } from '../../application/pack-manager.service';
import { PackManagerPage } from './pack-manager.page';

describe('PackManagerPage', () => {
  it('opens authentication when the user chooses to connect', () => {
    const session = createSessionMock(false);
    const page = createPage(session);

    page['connect']();

    expect(session.openAuthModal).toHaveBeenCalledOnce();
  });

  it('does not allow pack selection while disconnected', () => {
    const page = createPage(createSessionMock(false));

    expect(page['packSelectDisabled']()).toBe(true);
  });

  it('adds a merge member optimistically while publishing it', async () => {
    const packManager = createPackManagerMock();
    const pendingPublish = createDeferred<void>();
    packManager.addPackMembers.mockReturnValue(pendingPublish.promise);
    const page = createPage(createSessionMock(false), packManager);
    const member = createMember('0000000000000000000000000000000000000000000000000000000000000001');
    page['selectedPackId'].set('pack-1');
    page['mergeMembers'].set([member]);

    const addPromise = page['addMergeMember'](member);

    expect(page['members']()).toEqual([member]);
    expect(page['pendingAddPubkeys']().has(member.pubkey)).toBe(true);
    expect(page['mergePreviewRows']()).toEqual([{ member, inCurrentPack: true, pendingAdd: true }]);

    pendingPublish.resolve();
    await addPromise;

    expect(packManager.addPackMembers).toHaveBeenCalledWith('pack-1', [member.pubkey]);
    expect(page['pendingAddPubkeys']().has(member.pubkey)).toBe(false);
    expect(page['mergePreviewRows']()).toEqual([
      { member, inCurrentPack: true, pendingAdd: false },
    ]);
  });

  it('adds all missing merge members without duplicating existing members', async () => {
    const packManager = createPackManagerMock();
    const page = createPage(createSessionMock(false), packManager);
    const existingMember = createMember(
      '0000000000000000000000000000000000000000000000000000000000000001'
    );
    const missingMember = createMember(
      '0000000000000000000000000000000000000000000000000000000000000002'
    );
    page['selectedPackId'].set('pack-1');
    page['members'].set([existingMember]);
    page['mergeMembers'].set([existingMember, missingMember]);

    await page['addAllMergeMembers']();

    expect(page['members']()).toEqual([existingMember, missingMember]);
    expect(packManager.addPackMembers).toHaveBeenCalledWith('pack-1', [missingMember.pubkey]);
    expect(page['mergePreviewRows']()).toEqual([
      { member: existingMember, inCurrentPack: true, pendingAdd: false },
      { member: missingMember, inCurrentPack: true, pendingAdd: false },
    ]);
  });
});

function createPage(
  session: ReturnType<typeof createSessionMock>,
  packManager = createPackManagerMock()
): PackManagerPage {
  TestBed.configureTestingModule({
    providers: [
      { provide: NostrSessionService, useValue: session },
      { provide: PackManagerService, useValue: packManager },
    ],
  });

  return TestBed.runInInjectionContext(() => new PackManagerPage());
}

function createSessionMock(isAuthenticated: boolean) {
  return {
    isAuthenticated: signal(isAuthenticated),
    user: signal(null),
    openAuthModal: vi.fn(),
  };
}

function createPackManagerMock() {
  return {
    listOwnedPacks: vi.fn().mockResolvedValue([]),
    listPackMembers: vi.fn().mockResolvedValue([]),
    listPackMembersFromUrl: vi.fn().mockResolvedValue([]),
    addPackMembers: vi.fn().mockResolvedValue(undefined),
    removePackMember: vi.fn().mockResolvedValue(undefined),
  };
}

function createMember(pubkey: string) {
  return {
    pubkey,
    npub: `npub-${pubkey.slice(-4)}`,
    username: `User ${pubkey.slice(-4)}`,
    avatarUrl: null,
    primalUrl: `https://primal.net/p/npub-${pubkey.slice(-4)}`,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}
