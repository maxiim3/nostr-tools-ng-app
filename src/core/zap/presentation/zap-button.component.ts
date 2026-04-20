import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { ZapService } from '../zap.service';

@Component({
  selector: 'app-zap-button',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="btn btn-accent gap-2" (click)="open()">
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="size-4"
      >
        <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
      </svg>
      <span>{{ 'zap.button' | transloco }}</span>
    </button>
  `,
})
export class ZapButtonComponent {
  private readonly zap = inject(ZapService);

  protected open(): void {
    this.zap.openModal();
  }
}
