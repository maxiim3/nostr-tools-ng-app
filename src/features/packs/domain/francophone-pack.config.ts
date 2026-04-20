import { PROJECT_INFO } from '../../../core/config/project-info';

export const FRANCOPHONE_PACK = {
  slug: 'francophone',
  adminNpubs: [PROJECT_INFO.ownerNpub],
  starterPackUrl: '/',
  followUrl: `https://primal.net/p/${PROJECT_INFO.ownerNpub}`,
  externalLoginUrl: 'https://primal.net',
  zapHref: `lightning:${PROJECT_INFO.zapAddress}?amount=42000`
} as const;

export function primalProfileUrl(npub: string): string {
  return `https://primal.net/p/${npub}`;
}
