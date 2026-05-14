import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import {
  isPackApiTimeoutError,
  StarterPackRequestService,
  type UserRequestState,
} from '../../application/starter-pack-request.service';
import { type UserRequestStatus } from '../../domain/request-status';
import { OwnerSupportCardComponent } from '../components/owner-support-card.component';

const LOADING_MESSAGES = [
  'request.loading.1',
  'request.loading.2',
  'request.loading.3',
  'request.loading.4',
  'request.loading.5',
] as const;

@Component({
  selector: 'pack-request-page',
  imports: [TranslocoPipe, OwnerSupportCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pack-request.page.html',
})
export class PackRequestPage implements OnDestroy {
  private readonly session = inject(NostrSessionService);
  private readonly requestService = inject(StarterPackRequestService);

  readonly isAuthenticated = this.session.isAuthenticated;
  readonly requestStatus = signal<UserRequestStatus>('idle');
  readonly loading = signal(false);

  readonly loadingMessage = signal<string>(LOADING_MESSAGES[0]);
  readonly submitError = signal<string | null>(null);

  private loadingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      if (this.isAuthenticated()) {
        untracked(() => {
          void this.loadStatus();
        });
      } else {
        this.requestStatus.set('idle');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
    }
  }

  async connect(): Promise<void> {
    this.session.openAuthModal();
  }

  async loadStatus(): Promise<void> {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.startLoadingMessageRotation();
    this.submitError.set(null);

    try {
      const user = this.session.user();
      if (!user) return;

      const state = await this.requestService.getUserState();
      this.requestStatus.set(resolveRequestStatus(state));
    } catch (error: unknown) {
      this.requestStatus.set('idle');
      this.submitError.set(resolveSubmitErrorKey(error));
    } finally {
      this.loading.set(false);
      this.stopLoadingMessageRotation();
    }
  }

  async requestJoin(): Promise<void> {
    if (!this.isAuthenticated()) {
      this.session.openAuthModal();
      return;
    }

    if (this.loading()) {
      return;
    }

    this.submitError.set(null);
    this.loading.set(true);
    this.startLoadingMessageRotation();

    try {
      const state = await this.requestService.submitRequest();
      this.requestStatus.set(resolveRequestStatus(state));
    } catch (error: unknown) {
      this.submitError.set(resolveSubmitErrorKey(error));
    } finally {
      this.loading.set(false);
      this.stopLoadingMessageRotation();
    }
  }

  private startLoadingMessageRotation(): void {
    this.stopLoadingMessageRotation();
    const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
    this.loadingMessage.set(LOADING_MESSAGES[randomIndex]);

    this.loadingInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
      this.loadingMessage.set(LOADING_MESSAGES[randomIndex]);
    }, 3000);
  }

  private stopLoadingMessageRotation(): void {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
      this.loadingInterval = null;
    }
  }
}

export function resolveRequestStatus(state: UserRequestState): UserRequestStatus {
  return state.status;
}

export function resolveSubmitErrorKey(error: unknown): string {
  if (isPackApiTimeoutError(error)) {
    return 'request.submitError.timeout';
  }

  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) {
      return 'request.submitError.authError';
    }

    if (error.status === 403) {
      return 'request.submitError.forbidden';
    }

    if (error.status === 400) {
      return 'request.submitError.invalidRequest';
    }

    if (
      error.status === 500 ||
      error.status === 502 ||
      error.status === 503 ||
      error.status === 504
    ) {
      return 'request.submitError.generic';
    }
  }

  return 'request.submitError.generic';
}
