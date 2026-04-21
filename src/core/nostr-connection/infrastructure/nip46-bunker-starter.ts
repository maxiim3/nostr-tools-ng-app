import type { Nip46AttemptHandle } from './nip46-nostrconnect-starter';

export interface Nip46BunkerStarter {
  isAvailable(): Promise<boolean>;
  start(connectionToken: string): Promise<Nip46AttemptHandle>;
}
