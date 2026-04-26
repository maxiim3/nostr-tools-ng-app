import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { PROJECT_INFO } from '../../../../core/config/project-info';
import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import {
  FrancophonePackMembershipService,
  type PublicPackMemberEntry,
} from '../../../packs/application/francophone-pack-membership.service';
import {
  StarterPackRequestService,
  type AdminPackMemberEntry,
} from '../../../packs/application/starter-pack-request.service';
import { type UserRequestStatus } from '../../../packs/domain/request-status';

@Component({
  selector: 'pack-admin-requests-page',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pack-admin-requests.page.html',
})
export class PackAdminRequestsPage {
  private readonly packMembership = inject(FrancophonePackMembershipService);
  private readonly requests = inject(StarterPackRequestService);
  private readonly session = inject(NostrSessionService);

  protected readonly entries = signal<AdminPackMemberEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly actingOn = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly userRequestStatus = signal<UserRequestStatus | null>(null);
  protected readonly isPackMember = signal(false);
  protected readonly packFRUrl = PROJECT_INFO.packFRUrl;

  constructor() {
    void this.loadRequests();
    void this.loadUserStatus();
  }

  private async loadUserStatus(): Promise<void> {
    if (!this.session.isAuthenticated()) return;

    try {
      const state = await this.requests.getUserState();
      let isPackMember = false;

      try {
        isPackMember = await this.packMembership.isCurrentUserMember();
      } catch {
        isPackMember = false;
      }

      this.userRequestStatus.set(state.status === 'joined' ? 'joined' : 'idle');
      this.isPackMember.set(isPackMember);
    } catch {
      this.userRequestStatus.set(null);
      this.isPackMember.set(false);
    }
  }

  protected async remove(entry: AdminPackMemberEntry): Promise<void> {
    this.actionError.set(null);
    this.actingOn.set(entry.pubkey);

    try {
      await this.requests.removeMember(entry.pubkey);
      await this.loadRequests();
    } catch {
      this.actionError.set('adminRequests.errors.removeFailed');
    } finally {
      this.actingOn.set(null);
    }
  }

  private async loadRequests(): Promise<void> {
    this.loading.set(true);

    try {
      const [storedMembers, publicPackMembers] = await Promise.all([
        this.requests.listAdminRequests(),
        this.packMembership.listPublicPackMembers().catch(() => []),
      ]);

      this.entries.set(mergePackMembers(storedMembers, publicPackMembers));
    } finally {
      this.loading.set(false);
    }
  }
}

export function mergePackMembers(
  storedMembers: AdminPackMemberEntry[],
  publicPackMembers: PublicPackMemberEntry[]
): AdminPackMemberEntry[] {
  const membersByPubkey = new Map<string, AdminPackMemberEntry>();

  for (const member of storedMembers) {
    membersByPubkey.set(member.pubkey, member);
  }

  for (const member of publicPackMembers) {
    if (membersByPubkey.has(member.pubkey)) {
      continue;
    }

    membersByPubkey.set(member.pubkey, {
      pubkey: member.pubkey,
      username: member.username,
      description: member.description,
      avatarUrl: member.avatarUrl,
      primalUrl: `https://primal.net/p/${member.pubkey}`,
      joinedAt: 0,
      joinedAtLabel: '-',
      requestedFromApp: false,
      requestedAt: null,
      requestedAtLabel: '-',
      accountCreatedAt: null,
      accountCreatedAtLabel: '-',
      followerCount: null,
      followingCount: null,
      postCount: null,
      zapCount: null,
      canRemove: false,
    });
  }

  return [...membersByPubkey.values()].sort((left, right) => {
    if (left.joinedAt && right.joinedAt) {
      return right.joinedAt - left.joinedAt;
    }

    if (left.joinedAt) {
      return -1;
    }

    if (right.joinedAt) {
      return 1;
    }

    return left.username.localeCompare(right.username);
  });
}
