import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { PROJECT_INFO } from '../../../../core/config/project-info';
import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import { FrancophonePackMembershipService } from '../../../packs/application/francophone-pack-membership.service';
import { FrancophonePackNotificationService } from '../../../packs/application/francophone-pack-notification.service';
import {
  StarterPackRequestService,
  type AdminRequestEntry,
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
  private readonly packNotification = inject(FrancophonePackNotificationService);
  private readonly requests = inject(StarterPackRequestService);
  private readonly session = inject(NostrSessionService);

  protected readonly entries = signal<AdminRequestEntry[]>([]);
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

      this.userRequestStatus.set(state.status === 'pending' ? 'pending' : 'idle');
      this.isPackMember.set(isPackMember);
    } catch {
      this.userRequestStatus.set(null);
      this.isPackMember.set(false);
    }
  }

  protected async approve(entry: AdminRequestEntry): Promise<void> {
    this.actionError.set(null);
    this.actingOn.set(entry.requesterPubkey);

    try {
      await this.packMembership.addMember(entry.requesterPubkey);
      await this.packNotification.sendApprovalDirectMessage(entry.requesterPubkey);
      await this.requests.approveRequest(entry.requesterPubkey);
      await this.loadRequests();
    } catch {
      this.actionError.set('adminRequests.errors.approveFailed');
    } finally {
      this.actingOn.set(null);
    }
  }

  protected async reject(entry: AdminRequestEntry): Promise<void> {
    this.actionError.set(null);
    this.actingOn.set(entry.requesterPubkey);

    try {
      await this.requests.rejectRequest(entry.requesterPubkey);
      await this.loadRequests();
    } catch {
      this.actionError.set('adminRequests.errors.rejectFailed');
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
