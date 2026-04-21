import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppAuthModalComponent } from '../core/layout/presentation/components/app-auth-modal.component';
import { AppFooterComponent } from '../core/layout/presentation/components/app-footer.component';
import { AppHeaderComponent } from '../core/layout/presentation/components/app-header.component';
import { LanguageService } from '../core/i18n/language.service';
import { ZapModalComponent } from '../core/zap/presentation/zap-modal.component';

@Component({
  selector: 'app-root',
  imports: [
    AppAuthModalComponent,
    AppFooterComponent,
    AppHeaderComponent,
    ZapModalComponent,
    RouterOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block min-h-screen',
  },
  template: `
    <app-header />
    <router-outlet />
    <app-footer />
    <app-auth-modal />
    <app-zap-modal />
  `,
})
export class App {
  protected readonly language = inject(LanguageService);
}
