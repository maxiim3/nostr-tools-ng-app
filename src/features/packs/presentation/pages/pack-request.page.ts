import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { PROJECT_INFO } from '../../../../core/config/project-info';
import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import { FrancophonePackMembershipService } from '../../application/francophone-pack-membership.service';
import {
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
  private readonly packMembership = inject(FrancophonePackMembershipService);

  readonly isAuthenticated = this.session.isAuthenticated;
  readonly requestStatus = signal<UserRequestStatus>('idle');
  readonly isPackMember = signal(false);
  readonly packFRUrl = PROJECT_INFO.packFRUrl;
  readonly loading = signal(false);

  readonly loadingMessage = signal<string>(LOADING_MESSAGES[0]);
  readonly submitError = signal<string | null>(null);

  private loadingInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      if (this.isAuthenticated()) {
        this.loadStatus();
      } else {
        this.requestStatus.set('idle');
        this.isPackMember.set(false);
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
    this.loading.set(true);
    this.startLoadingMessageRotation();

    try {
      const user = this.session.user();
      if (!user) return;

      const state = await this.requestService.getUserState();
      let isPackMember = false;

      try {
        isPackMember = await this.packMembership.isCurrentUserMember();
      } catch {
        isPackMember = false;
      }

      this.isPackMember.set(isPackMember);
      this.requestStatus.set(resolveRequestStatus(state, isPackMember));
    } finally {
      this.loading.set(false);
      this.stopLoadingMessageRotation();
    }
  }

  async requestJoin(): Promise<void> {
    this.submitError.set(null);
    this.loading.set(true);
    this.startLoadingMessageRotation();

    try {
      await this.requestService.submitRequest();
      await this.loadStatus();
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

export function resolveRequestStatus(
  state: UserRequestState,
  isPackMember: boolean
): UserRequestStatus {
  if (isPackMember) {
    return 'idle';
  }

  return state.status === 'pending' ? 'pending' : 'idle';
}

export function resolveSubmitErrorKey(error: unknown): string {
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
  }

  return 'request.submitError.generic';
}
