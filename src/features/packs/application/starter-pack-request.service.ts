import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { NostrHttpAuthService } from '../../../core/nostr/application/nostr-http-auth.service';
import { NostrSessionService } from '../../../core/nostr/application/nostr-session.service';
import { type UserRequestStatus } from '../domain/request-status';

interface UserStateResponse {
  status: UserRequestStatus;
}

const PACK_API_TIMEOUT_MS = 35_000;

export class PackApiTimeoutError extends Error {
  constructor(message = 'Pack API request timed out.') {
    super(message);
    this.name = 'PackApiTimeoutError';
  }
}

export function isPackApiTimeoutError(error: unknown): boolean {
  return error instanceof PackApiTimeoutError;
}

interface AdminMemberRecord {
  pubkey: string;
  username: string;
  description: string | null;
  avatarUrl: string | null;
  joinedAt: string | null;
  followerCount: number | null;
  followingCount: number | null;
  accountCreatedAt: string | null;
  postCount: number | null;
  zapCount: number | null;
  requestedFromApp: boolean;
  requestedAt: string | null;
  removedAt: string | null;
  status: 'pending' | 'success' | 'rejected';
}

export interface UserRequestState {
  status: UserRequestStatus;
}

export interface SignedPackEventPayload {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface AdminPackMemberEntry {
  pubkey: string;
  username: string;
  description: string | null;
  avatarUrl: string | null;
  status: 'pending' | 'success' | 'rejected';
  primalUrl: string;
  joinedAt: number | null;
  joinedAtLabel: string;
  requestedFromApp: boolean;
  requestedAt: number | null;
  requestedAtLabel: string;
  accountCreatedAt: number | null;
  accountCreatedAtLabel: string;
  followerCount: number | null;
  followingCount: number | null;
  postCount: number | null;
  zapCount: number | null;
  isStored: boolean;
  canRemove: boolean;
}

@Injectable({ providedIn: 'root' })
export class StarterPackRequestService {
  private readonly http = inject(HttpClient);
  private readonly httpAuth = inject(NostrHttpAuthService);
  private readonly session = inject(NostrSessionService);

  async getUserState(): Promise<UserRequestState> {
    return this.get<UserStateResponse>('/api/pack-members/me');
  }

  async submitRequest(): Promise<UserRequestState> {
    const currentUser = this.session.user();
    if (!currentUser) {
      throw new Error('Authentication is required.');
    }

    return this.post<UserRequestState>('/api/pack-members', {
      username: currentUser.displayName,
      description: currentUser.description ?? null,
      avatarUrl: currentUser.imageUrl,
      followerCount: null,
      followingCount: null,
      accountCreatedAt: null,
      postCount: null,
      zapCount: null,
    });
  }

  async listAdminRequests(): Promise<AdminPackMemberEntry[]> {
    if (!this.session.isAdmin()) {
      return [];
    }

    const records = await this.get<AdminMemberRecord[]>('/api/admin/pack-members');

    return records.map((record) => ({
      pubkey: record.pubkey,
      username: record.username,
      description: record.description,
      avatarUrl: record.avatarUrl,
      status: record.status,
      primalUrl: `https://primal.net/p/${record.pubkey}`,
      joinedAt: record.joinedAt ? toEpochSeconds(record.joinedAt) : null,
      joinedAtLabel: formatOptionalDate(record.joinedAt),
      requestedFromApp: record.requestedFromApp,
      requestedAt: record.requestedAt ? toEpochSeconds(record.requestedAt) : null,
      requestedAtLabel: formatOptionalDate(record.requestedAt),
      accountCreatedAt: record.accountCreatedAt ? toEpochSeconds(record.accountCreatedAt) : null,
      accountCreatedAtLabel: formatOptionalDate(record.accountCreatedAt),
      followerCount: record.followerCount,
      followingCount: record.followingCount,
      postCount: record.postCount,
      zapCount: record.zapCount,
      isStored: true,
      canRemove: true,
    }));
  }

  async removeMember(pubkey: string): Promise<void> {
    await this.post<void>(`/api/admin/pack-members/${pubkey}/remove`, {});
  }

  async acceptMember(pubkey: string, packEvent: SignedPackEventPayload): Promise<void> {
    await this.post<void>(`/api/admin/pack-members/${pubkey}/accept`, {
      packEvent,
    });
  }

  async rejectMember(pubkey: string): Promise<void> {
    await this.post<void>(`/api/admin/pack-members/${pubkey}/reject`, {});
  }

  private async get<T>(path: string): Promise<T> {
    return withTimeout(this.getSigned<T>(path), PACK_API_TIMEOUT_MS);
  }

  private async getSigned<T>(path: string): Promise<T> {
    const url = buildApiUrl(path);
    const headers = await this.createSignedHeaders(url, 'GET');
    return firstValueFrom(this.http.get<T>(url, { headers }));
  }

  private async post<TResponse, TBody extends Record<string, unknown> = Record<string, unknown>>(
    path: string,
    body: TBody
  ): Promise<TResponse> {
    return withTimeout(this.postSigned<TResponse, TBody>(path, body), PACK_API_TIMEOUT_MS);
  }

  private async postSigned<TResponse, TBody extends Record<string, unknown>>(
    path: string,
    body: TBody
  ): Promise<TResponse> {
    const url = buildApiUrl(path);
    const headers = await this.createSignedHeaders(url, 'POST', body);

    return firstValueFrom(this.http.post<TResponse>(url, body, { headers }));
  }

  private async createSignedHeaders(
    url: string,
    method: string,
    body?: Record<string, unknown>
  ): Promise<HttpHeaders> {
    const authorization = await this.httpAuth.createAuthorizationHeader({
      url,
      method,
      body,
    });

    return new HttpHeaders({
      Authorization: authorization,
    });
  }
}

function buildApiUrl(path: string): string {
  if (typeof globalThis === 'undefined' || !globalThis.location) {
    return path;
  }

  const isLocal =
    globalThis.location.hostname === 'localhost' || globalThis.location.hostname === '127.0.0.1';
  const origin = isLocal ? 'http://127.0.0.1:4444' : globalThis.location.origin;

  return `${origin}${path}`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new PackApiTimeoutError());
    }, timeoutMs);

    void promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function toEpochSeconds(value: string): number {
  return new Date(value).getTime() / 1000;
}

function formatOptionalDate(value: string | null): string {
  if (!value) {
    return '-';
  }

  return formatDate(new Date(value));
}
