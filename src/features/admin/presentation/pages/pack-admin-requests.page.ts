import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { PROJECT_INFO } from '../../../../core/config/project-info';
import {
  FrancophonePackMembershipService,
  type PublicPackMemberEntry,
} from '../../../packs/application/francophone-pack-membership.service';
import {
  StarterPackRequestService,
  type AdminPackMemberEntry,
} from '../../../packs/application/starter-pack-request.service';

type SortField = 'username' | 'accountCreatedAt' | 'requestedFromApp' | 'joinedAt';
type SortDirection = 'asc' | 'desc';
type SourceLabelKey =
  | 'adminRequests.sources.app'
  | 'adminRequests.sources.db'
  | 'adminRequests.sources.publicPack';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

@Component({
  selector: 'pack-admin-requests-page',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pack-admin-requests.page.html',
})
export class PackAdminRequestsPage implements OnDestroy {
  private readonly packMembership = inject(FrancophonePackMembershipService);
  private readonly requests = inject(StarterPackRequestService);
  private confirmRemovalTimeout: ReturnType<typeof setTimeout> | null = null;

  protected readonly entries = signal<AdminPackMemberEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly actingOn = signal<string | null>(null);
  protected readonly confirmingRemovalPubkey = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly actionSuccess = signal<string | null>(null);
  protected readonly loadWarnings = signal<string[]>([]);
  protected readonly sortState = signal<SortState | null>(null);
  protected readonly packFRUrl = PROJECT_INFO.packFRUrl;
  protected readonly sortedEntries = computed(() => sortEntries(this.entries(), this.sortState()));

  constructor() {
    void this.loadRequests();
  }

  ngOnDestroy(): void {
    this.clearRemovalConfirmation();
  }

  protected async remove(entry: AdminPackMemberEntry): Promise<void> {
    this.actionError.set(null);
    this.actionSuccess.set(null);

    if (this.confirmingRemovalPubkey() !== entry.pubkey) {
      this.armRemovalConfirmation(entry.pubkey);
      return;
    }

    this.clearRemovalConfirmation();
    this.actingOn.set(entry.pubkey);

    try {
      await this.requests.removeMember(entry.pubkey);
      this.actionSuccess.set('adminRequests.removed');
      await this.loadRequests();
    } catch {
      this.clearRemovalConfirmation();
      this.actionError.set('adminRequests.errors.removeFailed');
    } finally {
      this.actingOn.set(null);
    }
  }

  protected async accept(entry: AdminPackMemberEntry): Promise<void> {
    this.actionError.set(null);
    this.actionSuccess.set(null);
    this.clearRemovalConfirmation();
    this.actingOn.set(entry.pubkey);

    try {
      const packEvent = await this.packMembership.createSignedAddMemberEvent(entry.pubkey);
      await this.requests.acceptMember(entry.pubkey, packEvent);
      this.actionSuccess.set('adminRequests.accepted');
      await this.loadRequests();
    } catch {
      this.actionError.set('adminRequests.errors.acceptFailed');
    } finally {
      this.actingOn.set(null);
    }
  }

  protected async reject(entry: AdminPackMemberEntry): Promise<void> {
    this.actionError.set(null);
    this.actionSuccess.set(null);
    this.clearRemovalConfirmation();
    this.actingOn.set(entry.pubkey);

    try {
      await this.requests.rejectMember(entry.pubkey);
      this.actionSuccess.set('adminRequests.rejected');
      await this.loadRequests();
    } catch {
      this.actionError.set('adminRequests.errors.rejectFailed');
    } finally {
      this.actingOn.set(null);
    }
  }

  protected sourceLabelKey(entry: AdminPackMemberEntry): SourceLabelKey {
    if (entry.isStored && entry.requestedFromApp) {
      return 'adminRequests.sources.app';
    }

    if (entry.isStored) {
      return 'adminRequests.sources.db';
    }

    return 'adminRequests.sources.publicPack';
  }

  private async loadRequests(): Promise<void> {
    this.loading.set(true);
    this.loadWarnings.set([]);

    try {
      const [storedResult, publicResult] = await Promise.allSettled([
        this.requests.listAdminRequests(),
        this.packMembership.listPublicPackMembers(),
      ]);

      const warnings: string[] = [];
      const storedMembers = storedResult.status === 'fulfilled' ? storedResult.value : [];
      const publicPackMembers = publicResult.status === 'fulfilled' ? publicResult.value : [];

      if (storedResult.status === 'rejected') {
        warnings.push('adminRequests.warnings.adminSourceUnavailable');
      }

      if (publicResult.status === 'rejected') {
        warnings.push('adminRequests.warnings.publicSourceUnavailable');
      }

      this.entries.set(mergePackMembers(storedMembers, publicPackMembers));
      this.loadWarnings.set(warnings);
    } finally {
      this.loading.set(false);
    }
  }

  protected toggleSort(field: SortField): void {
    const current = this.sortState();

    if (!current || current.field !== field) {
      this.sortState.set({ field, direction: 'asc' });
      return;
    }

    if (current.direction === 'asc') {
      this.sortState.set({ field, direction: 'desc' });
      return;
    }

    this.sortState.set(null);
  }

  protected sortIndicator(field: SortField): string {
    const current = this.sortState();

    if (!current || current.field !== field) {
      return '';
    }

    return current.direction === 'asc' ? '↑' : '↓';
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

  private clearRemovalConfirmation(): void {
    if (this.confirmRemovalTimeout) {
      clearTimeout(this.confirmRemovalTimeout);
      this.confirmRemovalTimeout = null;
    }

    this.confirmingRemovalPubkey.set(null);
  }
}

export function mergePackMembers(
  storedMembers: AdminPackMemberEntry[],
  publicPackMembers: PublicPackMemberEntry[]
): AdminPackMemberEntry[] {
  const membersByPubkey = new Map<string, AdminPackMemberEntry>();

  for (const member of storedMembers) {
    membersByPubkey.set(member.pubkey, member);
  }

  for (const member of publicPackMembers) {
    if (membersByPubkey.has(member.pubkey)) {
      continue;
    }

    membersByPubkey.set(member.pubkey, {
      pubkey: member.pubkey,
      username: member.username,
      description: member.description,
      avatarUrl: member.avatarUrl,
      status: 'success',
      primalUrl: `https://primal.net/p/${member.pubkey}`,
      joinedAt: null,
      joinedAtLabel: '-',
      requestedFromApp: false,
      requestedAt: null,
      requestedAtLabel: '-',
      accountCreatedAt: null,
      accountCreatedAtLabel: '-',
      followerCount: null,
      followingCount: null,
      postCount: null,
      zapCount: null,
      isStored: false,
      canRemove: false,
    });
  }

  return [...membersByPubkey.values()].sort((left, right) => {
    return compareStatusThenFreshness(left, right);
  });
}

function sortEntries(
  entries: AdminPackMemberEntry[],
  sortState: SortState | null
): AdminPackMemberEntry[] {
  if (!sortState) {
    return [...entries].sort(compareStatusThenFreshness);
  }

  const sorted = [...entries];
  sorted.sort((left, right) => compareEntries(left, right, sortState));
  return sorted;
}

function compareEntries(
  left: AdminPackMemberEntry,
  right: AdminPackMemberEntry,
  sortState: SortState
): number {
  const multiplier = sortState.direction === 'asc' ? 1 : -1;

  switch (sortState.field) {
    case 'username':
      return multiplier * left.username.localeCompare(right.username);
    case 'accountCreatedAt':
      return multiplier * compareNullableNumber(left.accountCreatedAt, right.accountCreatedAt);
    case 'requestedFromApp':
      return multiplier * compareBoolean(left.requestedFromApp, right.requestedFromApp);
    case 'joinedAt':
      return (
        multiplier *
        compareNullableNumber(toNullableNumber(left.joinedAt), toNullableNumber(right.joinedAt))
      );
  }
}

function compareStatusThenFreshness(
  left: AdminPackMemberEntry,
  right: AdminPackMemberEntry
): number {
  const statusOrder = statusPriority(left.status) - statusPriority(right.status);
  if (statusOrder !== 0) {
    return statusOrder;
  }

  const requestedOrder = compareNullableNumberDesc(
    toNullableNumber(left.requestedAt),
    toNullableNumber(right.requestedAt)
  );
  if (requestedOrder !== 0) {
    return requestedOrder;
  }

  const joinedOrder = compareNullableNumberDesc(
    toNullableNumber(left.joinedAt),
    toNullableNumber(right.joinedAt)
  );
  if (joinedOrder !== 0) {
    return joinedOrder;
  }

  return left.username.localeCompare(right.username);
}

function statusPriority(status: AdminPackMemberEntry['status']): number {
  if (status === 'pending') {
    return 0;
  }

  if (status === 'success') {
    return 1;
  }

  return 2;
}

function compareNullableNumber(left: number | null, right: number | null): number {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return left - right;
}

function compareNullableNumberDesc(left: number | null, right: number | null): number {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return right - left;
}

function compareBoolean(left: boolean, right: boolean): number {
  if (left === right) {
    return 0;
  }

  return left ? 1 : -1;
}

function toNullableNumber(value: number | null): number | null {
  return typeof value === 'number' && value > 0 ? value : null;
}
