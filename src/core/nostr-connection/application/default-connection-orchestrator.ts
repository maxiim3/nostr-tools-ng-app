import { ConnectionOrchestrator } from './connection-orchestrator';
import { InMemoryConnectionSessionStore } from './in-memory-connection-session-store';
import { Nip07ConnectionMethod } from './nip07-connection-method';
import { Nip46BunkerConnectionMethod } from './nip46-bunker-connection-method';
import { Nip46NostrconnectConnectionMethod } from './nip46-nostrconnect-connection-method';
import { NdkNip46BunkerStarter } from '../infrastructure/ndk-nip46-bunker-starter';
import { NdkNip46NostrconnectStarter } from '../infrastructure/ndk-nip46-nostrconnect-starter';

export function createDefaultConnectionOrchestrator(): ConnectionOrchestrator {
  return new ConnectionOrchestrator(
    [
      new Nip07ConnectionMethod(),
      new Nip46NostrconnectConnectionMethod(new NdkNip46NostrconnectStarter()),
      new Nip46BunkerConnectionMethod(new NdkNip46BunkerStarter()),
    ],
    new InMemoryConnectionSessionStore()
  );
}
