import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import { StarterPackRequestService, type UserRequestState } from '../../application/starter-pack-request.service';
import { type UserRequestStatus } from '../../domain/request-status';
import { pickRandomQuestion } from '../../domain/request-quiz';

@Component({
  selector: 'pack-request-page',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pack-request.page.html'
})
export class PackRequestPage {
  private readonly session = inject(NostrSessionService);
  private readonly requestService = inject(StarterPackRequestService);

  readonly isAuthenticated = this.session.isAuthenticated;
  readonly requestStatus = signal<UserRequestStatus>('idle');
  readonly loading = signal(false);
  readonly statusPillClass = computed(() => {
    switch (this.requestStatus()) {
      case 'pending': return 'badge-warning';
      case 'approved': return 'badge-success';
      default: return 'badge-neutral';
    }
  });

  constructor() {
    effect(() => {
      if (this.isAuthenticated()) {
        this.loadStatus();
      } else {
        this.requestStatus.set('idle');
      }
    });
  }

  async connect() {
    this.session.openAuthModal();
  }

  async loadStatus() {
    this.loading.set(true);
    try {
      const user = this.session.user();
      if (!user) return;
      const state: UserRequestState = await this.requestService.getUserState(user.pubkey);
      this.requestStatus.set(state.status);
    } finally {
      this.loading.set(false);
    }
  }

  async submitRequest() {
    this.loading.set(true);
    try {
      const question = pickRandomQuestion();
      await this.requestService.submitRequest(question.id);
      await this.loadStatus();
    } finally {
      this.loading.set(false);
    }
  }
}
