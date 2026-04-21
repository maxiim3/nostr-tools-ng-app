import { TestBed } from '@angular/core/testing';
import { UrlTree } from '@angular/router';

import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import { francophoneAdminGuard } from './francophone-admin.guard';

describe('francophoneAdminGuard', () => {
  let sessionMock: { isAdmin: () => boolean };

  beforeEach(() => {
    sessionMock = { isAdmin: () => false };
  });

  it('returns true when the user is an admin', () => {
    sessionMock.isAdmin = () => true;

    TestBed.configureTestingModule({
      providers: [{ provide: NostrSessionService, useValue: sessionMock }],
    });

    const result = TestBed.runInInjectionContext(() => francophoneAdminGuard({} as any, []));

    expect(result).toBe(true);
  });

  it('redirects to /packs/francophone/request when the user is not an admin', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: NostrSessionService, useValue: sessionMock }],
    });

    const result = TestBed.runInInjectionContext(() => francophoneAdminGuard({} as any, []));

    expect(result).not.toBe(true);
    expect(result instanceof UrlTree).toBe(true);
    const segments = (result as UrlTree).root.children['primary'].segments.map((s) => s.path);
    expect(segments).toEqual(['packs', 'francophone', 'request']);
  });

  it('redirects to /packs/francophone/request when the user is not logged in', () => {
    sessionMock.isAdmin = () => false;

    TestBed.configureTestingModule({
      providers: [{ provide: NostrSessionService, useValue: sessionMock }],
    });

    const result = TestBed.runInInjectionContext(() => francophoneAdminGuard({} as any, []));

    expect(result).not.toBe(true);
    expect(result instanceof UrlTree).toBe(true);
    const segments = (result as UrlTree).root.children['primary'].segments.map((s) => s.path);
    expect(segments).toEqual(['packs', 'francophone', 'request']);
  });
});
