import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { type RequestQuizChoice, type RequestQuizQuestion } from '../../domain/request-quiz';

@Component({
  selector: 'pack-quiz',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div class="space-y-2">
        <h3 class="text-lg font-bold text-[#0a0a0a]">
          {{ 'request.quiz.title' | transloco }}
        </h3>
        <p class="text-sm text-[#0a0a0a]/60">{{ 'request.quiz.subtitle' | transloco }}</p>
      </div>

      <p class="text-base font-bold text-[#0a0a0a]">{{ question().prompt }}</p>

      <div class="space-y-3">
        @for (choice of question().choices; track choice.id) {
          <button
            type="button"
            class="btn w-full justify-start text-left border-[3px] border-[#0a0a0a] font-bold"
            [class.quiz-selected]="selectedChoice()?.id === choice.id"
            [disabled]="submitting()"
            (click)="selectChoice(choice)"
          >
            {{ choice.label }}
          </button>
        }
      </div>

      @if (submitError()) {
        <p class="text-sm font-bold text-error">{{ submitError()! | transloco }}</p>
      } @else if (error()) {
        <p class="text-sm font-bold text-error">{{ 'request.quiz.error' | transloco }}</p>
      }

      <button
        type="button"
        class="btn btn-primary btn-lg mx-auto"
        [disabled]="!selectedChoice() || submitting()"
        (click)="submit()"
      >
        @if (submitting()) {
          <span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
        }
        {{ 'request.quiz.submit' | transloco }}
      </button>
    </div>
  `,
})
export class PackQuizComponent {
  readonly question = input.required<RequestQuizQuestion>();
  readonly submitting = input(false);
  readonly submitError = input<string | null>(null);
  readonly answerSelected = output<RequestQuizChoice>();

  readonly selectedChoice = signal<RequestQuizChoice | null>(null);
  readonly error = signal(false);

  selectChoice(choice: RequestQuizChoice): void {
    if (this.submitting()) {
      return;
    }

    this.selectedChoice.set(choice);
    this.error.set(false);
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }

    const choice = this.selectedChoice();
    if (!choice) {
      this.error.set(true);
      return;
    }

    this.answerSelected.emit(choice);
  }
}
