import { inject, Injectable } from '@angular/core';

import { PROJECT_INFO } from '../../../core/config/project-info';
import { NostrClientService } from '../../../core/nostr/application/nostr-client.service';

@Injectable({ providedIn: 'root' })
export class FrancophonePackNotificationService {
  private readonly nostrClient = inject(NostrClientService);

  async sendApprovalDirectMessage(requesterPubkey: string): Promise<void> {
    await this.nostrClient.sendDirectMessage(
      requesterPubkey,
      buildApprovalDirectMessage(PROJECT_INFO.packFRUrl)
    );
  }
}

function buildApprovalDirectMessage(packUrl: string): string {
  return `Vous avez été ajouté au starterpack fr : ${packUrl}\n\nEnsemble faisons grandir la communauté Nostr francophone !`;
}
