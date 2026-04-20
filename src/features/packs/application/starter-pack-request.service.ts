import { inject, Injectable } from '@angular/core';
import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';

import { LanguageService } from '../../../core/i18n/language.service';
import { NostrClientService } from '../../../core/nostr/application/nostr-client.service';
import { NostrSessionService } from '../../../core/nostr/application/nostr-session.service';
import { FRANCOPHONE_PACK, primalProfileUrl } from '../domain/francophone-pack.config';
import {
  resolveAdminRequestStatus,
  resolveUserRequestStatus,
  type AdminRequestStatus,
  type DecisionStamp,
  type UserRequestStatus
} from '../domain/request-status';

const REQUEST_KIND = 30100;
const DECISION_KIND = 30101;

interface RequestContent {
  lang?: string;
  submittedAt?: string;
  questionId?: string;
}

interface DecisionContent {
  status?: 'approved' | 'rejected';
  decidedAt?: string;
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
  status: AdminRequestStatus;
}

@Injectable({ providedIn: 'root' })
export class StarterPackRequestService {
  private readonly client = inject(NostrClientService);
  private readonly session = inject(NostrSessionService);
  private readonly language = inject(LanguageService);

  async getUserState(requesterPubkey: string): Promise<UserRequestState> {
    const [requestEvents, decisionEvents] = await Promise.all([
      this.client.fetchEvents(this.buildOwnRequestFilter(requesterPubkey)),
      this.client.fetchEvents(this.buildDecisionFilter(requesterPubkey))
    ]);

    const latestRequest = this.getLatestRequest(requestEvents);
    const latestDecision = this.getLatestDecision(decisionEvents);

    return {
      status: resolveUserRequestStatus(latestRequest, latestDecision)
    };
  }

  async submitRequest(questionId: string): Promise<void> {
    const currentUser = this.session.user();
    if (!currentUser) {
      throw new Error('Authentication is required.');
    }

    await this.client.publishEvent(
      REQUEST_KIND,
      [
        ['d', FRANCOPHONE_PACK.slug],
        ['t', FRANCOPHONE_PACK.slug]
      ],
      {
        lang: this.language.currentLanguage(),
        submittedAt: new Date().toISOString(),
        questionId
      }
    );
  }

  async listAdminRequests(): Promise<AdminRequestEntry[]> {
    if (!this.session.isAdmin()) {
      return [];
    }

    const [requestEvents, decisionEvents] = await Promise.all([
      this.client.fetchEvents(this.buildPackRequestFilter()),
      this.client.fetchEvents(this.buildPackDecisionFilter())
    ]);

    const latestRequests = new Map<string, NDKEvent>();
    for (const event of requestEvents) {
      if (!latestRequests.has(event.pubkey)) {
        latestRequests.set(event.pubkey, event);
      }
    }

    const latestDecisions = new Map<string, NDKEvent>();
    for (const event of decisionEvents) {
      const requesterPubkey = this.findTagValue(event, 'p');
      if (requesterPubkey && !latestDecisions.has(requesterPubkey)) {
        latestDecisions.set(requesterPubkey, event);
      }
    }

    const entries = await Promise.all(
      [...latestRequests.values()].map(async (requestEvent) => {
        const requesterPubkey = requestEvent.pubkey;
        const profile = await this.client.fetchProfile(requesterPubkey);
        const latestDecision = this.getLatestDecision(
          latestDecisions.get(requesterPubkey) ? [latestDecisions.get(requesterPubkey)!] : []
        );

        return {
          requesterPubkey,
          requesterNpub: profile.npub,
          displayName: profile.displayName,
          imageUrl: profile.imageUrl,
          primalUrl: primalProfileUrl(profile.npub),
          submittedAt: requestEvent.created_at ?? 0,
          submittedAtLabel: this.formatDate(requestEvent.created_at ?? 0),
          status: resolveAdminRequestStatus({ createdAt: requestEvent.created_at ?? 0 }, latestDecision)
        } satisfies AdminRequestEntry;
      })
    );

    return entries.sort((left, right) => {
      if (left.status === right.status) {
        return right.submittedAtLabel.localeCompare(left.submittedAtLabel);
      }

      if (left.status === 'pending') {
        return -1;
      }

      if (right.status === 'pending') {
        return 1;
      }

      return right.submittedAt - left.submittedAt;
    });
  }

  async approveRequest(requesterPubkey: string): Promise<void> {
    await this.publishDecision(requesterPubkey, 'approved');
  }

  async rejectRequest(requesterPubkey: string): Promise<void> {
    await this.publishDecision(requesterPubkey, 'rejected');
  }

  private async publishDecision(requesterPubkey: string, status: 'approved' | 'rejected'): Promise<void> {
    if (!this.session.isAdmin()) {
      throw new Error('Admin permissions are required.');
    }

    await this.client.publishEvent(
      DECISION_KIND,
      [
        ['d', `${FRANCOPHONE_PACK.slug}:${requesterPubkey}`],
        ['p', requesterPubkey],
        ['t', FRANCOPHONE_PACK.slug]
      ],
      {
        status,
        decidedAt: new Date().toISOString()
      }
    );
  }

  private buildOwnRequestFilter(requesterPubkey: string): NDKFilter {
    return {
      kinds: [REQUEST_KIND as never],
      authors: [requesterPubkey],
      '#d': [FRANCOPHONE_PACK.slug]
    };
  }

  private buildDecisionFilter(requesterPubkey: string): NDKFilter {
    return {
      kinds: [DECISION_KIND as never],
      '#p': [requesterPubkey],
      '#t': [FRANCOPHONE_PACK.slug]
    };
  }

  private buildPackRequestFilter(): NDKFilter {
    return {
      kinds: [REQUEST_KIND as never],
      '#t': [FRANCOPHONE_PACK.slug]
    };
  }

  private buildPackDecisionFilter(): NDKFilter {
    return {
      kinds: [DECISION_KIND as never],
      '#t': [FRANCOPHONE_PACK.slug]
    };
  }

  private getLatestRequest(events: NDKEvent[]): { createdAt: number } | null {
    const event = events[0];
    return event ? { createdAt: event.created_at ?? 0 } : null;
  }

  private getLatestDecision(events: NDKEvent[]): DecisionStamp | null {
    const event = events[0];
    if (!event) {
      return null;
    }

    const content = this.parseContent<DecisionContent>(event);
    if (content.status !== 'approved' && content.status !== 'rejected') {
      return null;
    }

    return {
      createdAt: event.created_at ?? 0,
      status: content.status
    };
  }

  private findTagValue(event: NDKEvent, tagName: string): string | null {
    const tag = event.tags.find(([name]) => name === tagName);
    return tag?.[1] ?? null;
  }

  private parseContent<T>(event: NDKEvent): T {
    try {
      return JSON.parse(event.content) as T;
    } catch {
      return {} as T;
    }
  }

  private formatDate(createdAt: number): string {
    return new Intl.DateTimeFormat(this.localeForCurrentLanguage(), {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(createdAt * 1000));
  }

  private localeForCurrentLanguage(): string {
    switch (this.language.currentLanguage()) {
      case 'en':
        return 'en-US';
      case 'es':
        return 'es-ES';
      default:
        return 'fr-FR';
    }
  }
}
