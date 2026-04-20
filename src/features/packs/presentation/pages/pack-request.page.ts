import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { PROJECT_INFO } from '../../../../core/config/project-info';
import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import { FrancophonePackMembershipService } from '../../application/francophone-pack-membership.service';
import {
  StarterPackRequestService,
  type UserRequestState
} from '../../application/starter-pack-request.service';
import { type UserRequestStatus } from '../../domain/request-status';
import { pickRandomQuestion, type RequestQuizChoice, type RequestQuizQuestion } from '../../domain/request-quiz';
import { PackQuizComponent } from '../../presentation/components/pack-quiz.component';

const LOADING_MESSAGES = [
  'request.loading.1',
  'request.loading.2',
  'request.loading.3',
  'request.loading.4',
  'request.loading.5'
] as const;

@Component({
  selector: 'pack-request-page',
  imports: [TranslocoPipe, PackQuizComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pack-request.page.html'
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
  readonly statusPillClass = computed(() => {
    switch (this.requestStatus()) {
      case 'pending':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  });

  readonly quizQuestion = signal<RequestQuizQuestion | null>(null);
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

  startQuiz(): void {
    this.submitError.set(null);
    this.quizQuestion.set(pickRandomQuestion());
  }

  cancelQuiz(): void {
    this.submitError.set(null);
    this.quizQuestion.set(null);
  }

  async submitRequest(choice: RequestQuizChoice): Promise<void> {
    const question = this.quizQuestion();
    if (!question) {
      return;
    }

    this.submitError.set(null);
    this.loading.set(true);
    this.startLoadingMessageRotation();

    try {
      await this.requestService.submitRequest(question.id, choice.id);
      this.quizQuestion.set(null);
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

function resolveRequestStatus(state: UserRequestState, isPackMember: boolean): UserRequestStatus {
  if (isPackMember) {
    return 'idle';
  }

  return state.status === 'pending' ? 'pending' : 'idle';
}

function resolveSubmitErrorKey(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) {
      return 'request.quiz.authError';
    }

    if (error.status === 403) {
      return 'request.quiz.forbidden';
    }

    if (error.status === 400) {
      return 'request.quiz.invalidRequest';
    }
  }

  return 'request.quiz.submitError';
}
