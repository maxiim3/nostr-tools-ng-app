import '@angular/compiler';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { NostrHttpAuthService } from '../../../core/nostr/application/nostr-http-auth.service';
import { NostrSessionService } from '../../../core/nostr/application/nostr-session.service';
import { StarterPackRequestService } from './starter-pack-request.service';

describe('StarterPackRequestService', () => {
  let service: StarterPackRequestService;

  let httpGetMock: ReturnType<typeof vi.fn>;
  let httpPostMock: ReturnType<typeof vi.fn>;
  let createAuthorizationHeaderMock: ReturnType<typeof vi.fn>;
  let userMock: ReturnType<typeof vi.fn>;
  let isAdminMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    httpGetMock = vi.fn().mockReturnValue(of(undefined));
    httpPostMock = vi.fn().mockReturnValue(of(undefined));
    createAuthorizationHeaderMock = vi.fn().mockResolvedValue('Nostr abc123');
    userMock = vi.fn().mockReturnValue(null);
    isAdminMock = vi.fn().mockReturnValue(false);

    TestBed.configureTestingModule({
      providers: [
        StarterPackRequestService,
        { provide: HttpClient, useValue: { get: httpGetMock, post: httpPostMock } },
        {
          provide: NostrHttpAuthService,
          useValue: { createAuthorizationHeader: createAuthorizationHeaderMock },
        },
        { provide: NostrSessionService, useValue: { user: userMock, isAdmin: isAdminMock } },
      ],
    });

    service = TestBed.inject(StarterPackRequestService);
  });

  describe('submitRequest', () => {
    it('throws when no user is authenticated', async () => {
      userMock.mockReturnValue(null);

      await expect(service.submitRequest()).rejects.toThrow('Authentication is required.');
    });

    it('posts request data when user is authenticated', async () => {
      userMock.mockReturnValue({ displayName: 'Alice', imageUrl: 'img.png' });
      httpPostMock.mockReturnValue(of(undefined));

      await service.submitRequest();

      expect(httpPostMock).toHaveBeenCalledTimes(1);
      const [, body] = httpPostMock.mock.calls[0] as [string, Record<string, unknown>];
      expect(body).toEqual({
        username: 'Alice',
        description: null,
        avatarUrl: 'img.png',
        followerCount: null,
        followingCount: null,
        accountCreatedAt: null,
        postCount: null,
        zapCount: null,
      });
      expect(body).not.toHaveProperty('questionId');
      expect(body).not.toHaveProperty('choiceId');
    });
  });

  describe('listAdminRequests', () => {
    it('returns empty array when user is not admin', async () => {
      isAdminMock.mockReturnValue(false);

      const result = await service.listAdminRequests();

      expect(result).toEqual([]);
    });

    it('maps records and builds primal URL when admin', async () => {
      isAdminMock.mockReturnValue(true);
      httpGetMock.mockReturnValue(
        of([
          {
            pubkey: 'pk1',
            username: 'Bob',
            description: 'hello',
            avatarUrl: 'bob.png',
            joinedAt: '2025-01-15T10:30:00Z',
            followerCount: 1,
            followingCount: 2,
            accountCreatedAt: '2024-01-15T10:30:00Z',
            postCount: 3,
            zapCount: null,
            requestedFromApp: true,
            requestedAt: '2025-01-15T10:30:00Z',
            removedAt: null,
          },
        ])
      );

      const result = await service.listAdminRequests();

      expect(result).toHaveLength(1);
      expect(result[0].pubkey).toBe('pk1');
      expect(result[0].username).toBe('Bob');
      expect(result[0].description).toBe('hello');
      expect(result[0].primalUrl).toBe('https://primal.net/p/pk1');
      expect(result[0].requestedFromApp).toBe(true);
      expect(typeof result[0].joinedAt).toBe('number');
      expect(typeof result[0].joinedAtLabel).toBe('string');
      expect(typeof result[0].requestedAt).toBe('number');
      expect(typeof result[0].requestedAtLabel).toBe('string');
      expect(typeof result[0].accountCreatedAt).toBe('number');
      expect(typeof result[0].accountCreatedAtLabel).toBe('string');
    });
  });
});
