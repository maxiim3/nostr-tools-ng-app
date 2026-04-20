import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { StarterPackRequestService, type AdminRequestEntry } from '../../../packs/application/starter-pack-request.service';

@Component({
  selector: 'pack-admin-requests-page',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pack-admin-requests.page.html'
})
export class PackAdminRequestsPage {
  private readonly requests = inject(StarterPackRequestService);

  protected readonly entries = signal<AdminRequestEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly actingOn = signal<string | null>(null);

  constructor() {
    void this.loadRequests();
  }

  protected async approve(entry: AdminRequestEntry): Promise<void> {
    this.actingOn.set(entry.requesterPubkey);

    try {
      await this.requests.approveRequest(entry.requesterPubkey);
      await this.loadRequests();
    } finally {
      this.actingOn.set(null);
    }
  }

  protected async reject(entry: AdminRequestEntry): Promise<void> {
    this.actingOn.set(entry.requesterPubkey);

    try {
      await this.requests.rejectRequest(entry.requesterPubkey);
      await this.loadRequests();
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
