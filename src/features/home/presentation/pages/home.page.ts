import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// import { PROJECT_INFO } from '../../../../core/config/project-info';
// import { NostrClientService, type SessionUser } from '../../../../core/nostr/application/nostr-client.service';
// import { ProfileCardComponent, type ProfileCardStatus } from '../../../../shared/presentation/components/profile-card.component';

@Component({
  selector: 'home-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: '',
  },
  templateUrl: 'home.page.html',
})
export class HomePage {
  // private readonly client = inject(NostrClientService);
  //
  // protected readonly sourceProfile = signal<SessionUser | null>(null);
  // protected readonly targetProfile = signal<SessionUser | null>(null);
  // protected readonly profilesLoading = signal(true);
  //
  // protected readonly sourceStatus = computed<ProfileCardStatus>(() => (this.profilesLoading() ? 'skeleton' : 'muted'));
  // protected readonly targetStatus = computed<ProfileCardStatus>(() => (this.profilesLoading() ? 'skeleton' : 'success'));
  // protected readonly transparentStatus = computed<ProfileCardStatus>(() =>
  //   this.profilesLoading() ? 'skeleton' : 'transparent'
  // );
  //
  // constructor() {
  //   void this.loadProfiles();
  // }
  //
  // private async loadProfiles(): Promise<void> {
  //   this.profilesLoading.set(true);
  //
  //   try {
  //     const [sourceProfile, targetProfile] = await Promise.all([
  //       this.client.fetchProfile(PROJECT_INFO.ownerNpub),
  //       this.client.fetchProfile(PROJECT_INFO.calleNpub)
  //     ]);
  //
  //     this.sourceProfile.set(sourceProfile);
  //     this.targetProfile.set(targetProfile);
  //   } finally {
  //     this.profilesLoading.set(false);
  //   }
  // }
}
