import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { NostrHttpAuthService } from '../../../core/nostr/application/nostr-http-auth.service';
import { NostrSessionService } from '../../../core/nostr/application/nostr-session.service';
import { type UserRequestStatus } from '../domain/request-status';

type RequestStatus = 'pending' | 'approved' | 'rejected';

interface UserStateResponse {
  status: UserRequestStatus;
}

interface AdminRequestRecord {
  requesterPubkey: string;
  requesterNpub: string;
  displayName: string;
  imageUrl: string | null;
  created: string;
  status: RequestStatus;
}

export interface UserRequestState {
  status: UserRequestStatus;
}

export interface AdminRequestEntry {
  requesterPubkey: string;
  requesterNpub: string;
  displayName: string;
  imageUrl: string | null;
  primalUrl: string;
  submittedAt: number;
  submittedAtLabel: string;
  status: RequestStatus;
}

@Injectable({ providedIn: 'root' })
export class StarterPackRequestService {
  private readonly http = inject(HttpClient);
  private readonly httpAuth = inject(NostrHttpAuthService);
  private readonly session = inject(NostrSessionService);

  async getUserState(): Promise<UserRequestState> {
    return this.get<UserStateResponse>('/api/pack-requests/me');
  }

  async submitRequest(): Promise<void> {
    const currentUser = this.session.user();
    if (!currentUser) {
      throw new Error('Authentication is required.');
    }

    await this.post('/api/pack-requests', {
      displayName: currentUser.displayName,
      imageUrl: currentUser.imageUrl,
    });
  }

  async listAdminRequests(): Promise<AdminRequestEntry[]> {
    if (!this.session.isAdmin()) {
      return [];
    }

    const records = await this.get<AdminRequestRecord[]>('/api/admin/pack-requests');

    return records.map((record) => ({
      requesterPubkey: record.requesterPubkey,
      requesterNpub: record.requesterNpub,
      displayName: record.displayName,
      imageUrl: record.imageUrl,
      primalUrl: `https://primal.net/p/${record.requesterNpub}`,
      submittedAt: new Date(record.created).getTime() / 1000,
      submittedAtLabel: formatDate(new Date(record.created)),
      status: record.status,
    }));
  }

  async approveRequest(requesterPubkey: string): Promise<void> {
    await this.post(`/api/admin/pack-requests/${requesterPubkey}/approve`, {});
  }

  async rejectRequest(requesterPubkey: string): Promise<void> {
    await this.post(`/api/admin/pack-requests/${requesterPubkey}/reject`, {});
  }

  private async get<T>(path: string): Promise<T> {
    const url = buildApiUrl(path);
    const headers = await this.createSignedHeaders(url, 'GET');

    return firstValueFrom(this.http.get<T>(url, { headers }));
  }

  private async post<TBody extends Record<string, unknown>>(
    path: string,
    body: TBody
  ): Promise<void> {
    const url = buildApiUrl(path);
    const headers = await this.createSignedHeaders(url, 'POST', body);

    await firstValueFrom(this.http.post(url, body, { headers }));
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
  const origin = isLocal ? 'http://127.0.0.1:3000' : globalThis.location.origin;

  return `${origin}${path}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
