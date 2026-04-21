import '@angular/compiler';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { NostrClientService } from '../../../core/nostr/application/nostr-client.service';
import { NostrSessionService } from '../../../core/nostr/application/nostr-session.service';
import { StarterPackRequestService } from './starter-pack-request.service';

describe('StarterPackRequestService', () => {
  let service: StarterPackRequestService;

  let httpGetMock: ReturnType<typeof vi.fn>;
  let httpPostMock: ReturnType<typeof vi.fn>;
  let createAuthHeaderMock: ReturnType<typeof vi.fn>;
  let userMock: ReturnType<typeof vi.fn>;
  let isAdminMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    httpGetMock = vi.fn().mockReturnValue(of(undefined));
    httpPostMock = vi.fn().mockReturnValue(of(undefined));
    createAuthHeaderMock = vi.fn().mockResolvedValue('Nostr abc123');
    userMock = vi.fn().mockReturnValue(null);
    isAdminMock = vi.fn().mockReturnValue(false);

    TestBed.configureTestingModule({
      providers: [
        StarterPackRequestService,
        { provide: HttpClient, useValue: { get: httpGetMock, post: httpPostMock } },
        { provide: NostrClientService, useValue: { createHttpAuthHeader: createAuthHeaderMock } },
        { provide: NostrSessionService, useValue: { user: userMock, isAdmin: isAdminMock } },
      ],
    });

    service = TestBed.inject(StarterPackRequestService);
  });

  describe('submitRequest', () => {
    it('throws when no user is authenticated', async () => {
      userMock.mockReturnValue(null);

      await expect(service.submitRequest('q1', 'c1')).rejects.toThrow(
        'Authentication is required.'
      );
    });

    it('posts request data when user is authenticated', async () => {
      userMock.mockReturnValue({ displayName: 'Alice', imageUrl: 'img.png' });
      httpPostMock.mockReturnValue(of(undefined));

      await service.submitRequest('q1', 'c1');

      expect(httpPostMock).toHaveBeenCalledTimes(1);
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
            requesterPubkey: 'pk1',
            requesterNpub: 'npub1abc',
            displayName: 'Bob',
            imageUrl: 'bob.png',
            created: '2025-01-15T10:30:00Z',
            status: 'pending',
          },
        ])
      );

      const result = await service.listAdminRequests();

      expect(result).toHaveLength(1);
      expect(result[0].requesterPubkey).toBe('pk1');
      expect(result[0].requesterNpub).toBe('npub1abc');
      expect(result[0].displayName).toBe('Bob');
      expect(result[0].primalUrl).toBe('https://primal.net/p/npub1abc');
      expect(result[0].status).toBe('pending');
      expect(typeof result[0].submittedAt).toBe('number');
      expect(typeof result[0].submittedAtLabel).toBe('string');
    });
  });
});
