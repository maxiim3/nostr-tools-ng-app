import { Pipe, PipeTransform, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { LanguageService } from '../../../i18n/language.service';
import type { SessionUser } from '../../../nostr/application/nostr-client.service';
import { NostrSessionService } from '../../../nostr/application/nostr-session.service';
import { ZapService } from '../../../zap/zap.service';
import { AppHeaderComponent } from './app-header.component';

@Pipe({
  name: 'transloco',
})
class MockTranslocoPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

const sessionUser: SessionUser = {
  pubkey: 'f'.repeat(64),
  npub: 'npub1headeruser',
  displayName: 'Header User',
  imageUrl: null,
  description: null,
  nip05: null,
};

describe('AppHeaderComponent', () => {
  let fixture: ComponentFixture<AppHeaderComponent>;
  let session: ReturnType<typeof createSessionMock>;

  beforeEach(async () => {
    session = createSessionMock();

    TestBed.overrideComponent(AppHeaderComponent, {
      remove: { imports: [TranslocoPipe] },
      add: { imports: [MockTranslocoPipe] },
    });

    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        provideRouter([]),
        { provide: NostrSessionService, useValue: session },
        {
          provide: LanguageService,
          useValue: {
            supportedLanguages: ['fr', 'en', 'es'],
            currentLanguage: signal('fr'),
            setLanguage: vi.fn(),
          },
        },
        {
          provide: ZapService,
          useValue: {
            openModal: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('uses native desktop and mobile sign-out buttons that disconnect and expose reconnect', async () => {
    fixture.detectChanges();

    clickButton(fixture, 'common.logout');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(session.disconnect).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('common.login');

    session.user.set(sessionUser);
    fixture.detectChanges();

    clickButtonByLabel(fixture, 'Toggle menu');
    fixture.detectChanges();
    clickButton(fixture, 'common.logout');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(session.disconnect).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('common.login');
  });
});

function createSessionMock() {
  const session = {
    user: signal<SessionUser | null>(sessionUser),
    isAdmin: signal(false),
    connecting: signal(false),
    openAuthModal: vi.fn(),
    disconnect: vi.fn<() => Promise<void>>().mockImplementation(async () => {
      session.user.set(null);
    }),
  };

  return session;
}

function clickButton(fixture: ComponentFixture<AppHeaderComponent>, text: string): void {
  const button = [...fixture.nativeElement.querySelectorAll('button')].find((element) =>
    element.textContent?.includes(text)
  ) as HTMLButtonElement | undefined;

  if (!button) {
    throw new Error(`Button containing "${text}" not found.`);
  }

  button.click();
}

function clickButtonByLabel(fixture: ComponentFixture<AppHeaderComponent>, label: string): void {
  const button = fixture.nativeElement.querySelector(
    `button[aria-label="${label}"]`
  ) as HTMLButtonElement | null;

  if (!button) {
    throw new Error(`Button with label "${label}" not found.`);
  }

  button.click();
}
