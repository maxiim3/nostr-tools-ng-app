import type { ActiveConnection, ConnectionRevalidationResult } from './active-connection';

export interface ConnectionSessionStore {
  getCurrent(): ActiveConnection | null;
  setCurrent(connection: ActiveConnection): void;
  clear(): Promise<void>;
  revalidateCurrent(): Promise<ConnectionRevalidationResult | null>;
}
