import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { NostrSessionService } from '../../../../core/nostr/application/nostr-session.service';
import {
  PackManagerService,
  type OwnedPackSummary,
  type PackMember,
} from '../../application/pack-manager.service';

@Component({
  selector: 'pack-manager-page',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pack-manager.page.html',
})
export class PackManagerPage implements OnDestroy {
  protected readonly session = inject(NostrSessionService);
  private readonly packManager = inject(PackManagerService);
  private clearCopiedTimeout: ReturnType<typeof setTimeout> | null = null;
  private confirmRemovalTimeout: ReturnType<typeof setTimeout> | null = null;

  protected readonly packs = signal<OwnedPackSummary[]>([]);
  protected readonly selectedPackId = signal('');
  protected readonly members = signal<PackMember[]>([]);
  protected readonly loadingPacks = signal(false);
  protected readonly loadingMembers = signal(false);
  protected readonly mergeSourceUrl = signal('');
  protected readonly loadingMergeMembers = signal(false);
  protected readonly mergeMembers = signal<PackMember[]>([]);
  protected readonly mergeError = signal<string | null>(null);
  protected readonly actingOn = signal<string | null>(null);
  protected readonly copiedPubkey = signal<string | null>(null);
  protected readonly confirmingRemovalPubkey = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly actionSuccess = signal<string | null>(null);

  protected readonly selectedPack = computed(
    () => this.packs().find((pack) => pack.id === this.selectedPackId()) ?? null
  );
  protected readonly packSelectDisabled = computed(
    () => !this.session.isAuthenticated() || this.loadingPacks() || this.packs().length === 0
  );
  protected readonly mergeLoadDisabled = computed(
    () =>
      !this.session.isAuthenticated() ||
      this.loadingMergeMembers() ||
      this.mergeSourceUrl().trim().length === 0
  );

  constructor() {
    effect(() => {
      if (this.session.isAuthenticated()) {
        void this.loadOwnedPacks();
      } else {
        this.resetState();
      }
    });
  }

  ngOnDestroy(): void {
    this.clearCopiedState();
    this.clearRemovalConfirmation();
  }

  protected connect(): void {
    this.session.openAuthModal();
  }

  protected onPackSelectionChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    this.selectPack(select?.value ?? '');
  }

  protected onMergeSourceUrlInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.mergeSourceUrl.set(input?.value ?? '');
    this.mergeError.set(null);
  }

  protected async loadMergeSource(): Promise<void> {
    const packUrl = this.mergeSourceUrl().trim();
    if (!packUrl) {
      return;
    }

    this.loadingMergeMembers.set(true);
    this.mergeError.set(null);
    this.mergeMembers.set([]);

    try {
      this.mergeMembers.set(await this.packManager.listPackMembersFromUrl(packUrl));
    } catch {
      this.mergeError.set('packManager.errors.invalidUrl');
    } finally {
      this.loadingMergeMembers.set(false);
    }
  }

  protected async copyNpub(member: PackMember): Promise<void> {
    this.actionError.set(null);
    this.actionSuccess.set(null);

    try {
      await globalThis.navigator.clipboard.writeText(member.npub);
      this.clearCopiedState();
      this.copiedPubkey.set(member.pubkey);
      this.clearCopiedTimeout = setTimeout(() => {
        if (this.copiedPubkey() === member.pubkey) {
          this.copiedPubkey.set(null);
        }

        this.clearCopiedTimeout = null;
      }, 2000);
    } catch {
      this.actionError.set('packManager.errors.copyFailed');
    }
  }

  protected async removeMember(member: PackMember): Promise<void> {
    this.actionError.set(null);
    this.actionSuccess.set(null);

    if (this.confirmingRemovalPubkey() !== member.pubkey) {
      this.armRemovalConfirmation(member.pubkey);
      return;
    }

    const packId = this.selectedPackId();
    if (!packId) {
      return;
    }

    this.clearRemovalConfirmation();
    this.actingOn.set(member.pubkey);

    try {
      await this.packManager.removePackMember(packId, member.pubkey);
      this.actionSuccess.set('packManager.memberRemoved');
      await this.loadOwnedPacks({ preserveSelection: true });
    } catch {
      this.actionError.set('packManager.errors.removeFailed');
    } finally {
      this.actingOn.set(null);
    }
  }

  private async loadOwnedPacks(options: { preserveSelection?: boolean } = {}): Promise<void> {
    this.loadingPacks.set(true);
    this.actionError.set(null);

    try {
      const previousSelection = options.preserveSelection ? this.selectedPackId() : '';
      const packs = await this.packManager.listOwnedPacks();
      this.packs.set(packs);

      const nextSelection =
        previousSelection && packs.some((pack) => pack.id === previousSelection)
          ? previousSelection
          : (packs[0]?.id ?? '');

      this.selectPack(nextSelection);
    } catch {
      this.resetState();
      this.actionError.set('packManager.errors.loadPacksFailed');
    } finally {
      this.loadingPacks.set(false);
    }
  }

  private selectPack(packId: string): void {
    this.selectedPackId.set(packId);
    this.members.set([]);
    this.mergeSourceUrl.set('');
    this.mergeMembers.set([]);
    this.mergeError.set(null);
    this.clearRemovalConfirmation();

    if (!packId) {
      return;
    }

    void this.loadMembers(packId);
  }

  private async loadMembers(packId: string): Promise<void> {
    this.loadingMembers.set(true);
    this.actionError.set(null);

    try {
      this.members.set(await this.packManager.listPackMembers(packId));
    } catch {
      this.members.set([]);
      this.actionError.set('packManager.errors.loadMembersFailed');
    } finally {
      this.loadingMembers.set(false);
    }
  }

  private resetState(): void {
    this.packs.set([]);
    this.selectedPackId.set('');
    this.members.set([]);
    this.mergeSourceUrl.set('');
    this.mergeMembers.set([]);
    this.mergeError.set(null);
    this.loadingMergeMembers.set(false);
    this.loadingPacks.set(false);
    this.loadingMembers.set(false);
    this.actingOn.set(null);
    this.actionError.set(null);
    this.actionSuccess.set(null);
    this.clearCopiedState();
    this.clearRemovalConfirmation();
  }

  private armRemovalConfirmation(pubkey: string): void {
    this.clearRemovalConfirmation();
    this.confirmingRemovalPubkey.set(pubkey);
    this.confirmRemovalTimeout = setTimeout(() => {
      if (this.confirmingRemovalPubkey() === pubkey) {
        this.confirmingRemovalPubkey.set(null);
      }

      this.confirmRemovalTimeout = null;
    }, 3000);
  }

  private clearCopiedState(): void {
    if (this.clearCopiedTimeout) {
      clearTimeout(this.clearCopiedTimeout);
      this.clearCopiedTimeout = null;
    }

    this.copiedPubkey.set(null);
  }

  private clearRemovalConfirmation(): void {
    if (this.confirmRemovalTimeout) {
      clearTimeout(this.confirmRemovalTimeout);
      this.confirmRemovalTimeout = null;
    }

    this.confirmingRemovalPubkey.set(null);
  }
}
