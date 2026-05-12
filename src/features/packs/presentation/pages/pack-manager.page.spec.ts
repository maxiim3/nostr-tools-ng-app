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
    removePackMember: vi.fn().mockResolvedValue(undefined),
  };
}
