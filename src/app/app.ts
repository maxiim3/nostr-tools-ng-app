import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppAuthModalComponent } from '../core/layout/presentation/components/app-auth-modal.component';
import { AppHeaderComponent } from '../core/layout/presentation/components/app-header.component';
import { LanguageService } from '../core/i18n/language.service';

@Component({
  selector: 'app-root',
  imports: [AppAuthModalComponent, AppHeaderComponent, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block min-h-screen'
  },
  template: `
    <app-header />
    <router-outlet />
    <app-auth-modal />
  `
})
export class App {
  protected readonly language = inject(LanguageService);
}
