import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { LanguageService } from '../../../../core/i18n/language.service';
import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import { StarterPackRequestService } from '../../application/starter-pack-request.service';
import { FRANCOPHONE_PACK } from '../../domain/francophone-pack.config';
import { pickRandomQuestion, type RequestQuizQuestion } from '../../domain/request-quiz';
import type { UserRequestStatus } from '../../domain/request-status';

@Component({
  selector: 'pack-request-page',
  imports: [ReactiveFormsModule, RouterLink, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pack-request.page.html'
})
export class PackRequestPage {
  protected readonly session = inject(NostrSessionService);
  private readonly requests = inject(StarterPackRequestService);
  private readonly language = inject(LanguageService);

  protected readonly pack = FRANCOPHONE_PACK;
  protected readonly status = signal<UserRequestStatus>('idle');
  protected readonly loadingStatus = signal(false);
  protected readonly quizOpen = signal(false);
  protected readonly quizCompleted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly quizError = signal<string | null>(null);
  protected readonly currentQuestion = signal<RequestQuizQuestion>(pickRandomQuestion());
  protected readonly answerControl = new FormControl<string | null>(null, Validators.required);

  constructor() {
    effect(() => {
      const currentUser = this.session.user();

      if (currentUser) {
        void this.loadStatus(currentUser.pubkey);
      } else {
        this.status.set('idle');
        this.quizOpen.set(false);
        this.quizCompleted.set(false);
      }
    });
  }

  protected openAuthModal(): void {
    this.session.openAuthModal();
  }

  protected openQuiz(): void {
    this.currentQuestion.set(pickRandomQuestion());
    this.answerControl.reset();
    this.quizError.set(null);
    this.quizCompleted.set(false);
    this.quizOpen.set(true);
  }

  protected closeQuiz(): void {
    this.quizOpen.set(false);
  }

  protected async submitQuiz(): Promise<void> {
    const question = this.currentQuestion();
    const selectedChoice = question.choices.find((choice) => choice.id === this.answerControl.value);

    if (!selectedChoice?.correct) {
      this.quizError.set('request.quiz.error');
      return;
    }

    this.submitting.set(true);
    this.quizError.set(null);

    try {
      await this.requests.submitRequest(question.id);

      const currentUser = this.session.user();
      if (currentUser) {
        await this.loadStatus(currentUser.pubkey);
      }

      this.quizCompleted.set(true);
    } catch (error) {
      this.quizError.set(error instanceof Error ? error.message : 'request.quiz.error');
    } finally {
      this.submitting.set(false);
    }
  }

  private async loadStatus(requesterPubkey: string): Promise<void> {
    this.loadingStatus.set(true);

    try {
      const state = await this.requests.getUserState(requesterPubkey);
      this.status.set(state.status);
    } finally {
      this.loadingStatus.set(false);
    }
  }
}
