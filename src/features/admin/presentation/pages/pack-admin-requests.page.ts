import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { PROJECT_INFO } from '../../../../core/config/project-info';
import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import { FrancophonePackMembershipService } from '../../../packs/application/francophone-pack-membership.service';
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
      this.entries.set(await this.requests.listAdminRequests());
    } finally {
      this.loading.set(false);
    }
  }
}
