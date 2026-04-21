export type ConnectionErrorCode =
  | 'invalid_pubkey'
  | 'validation_failed'
  | 'method_unavailable'
  | 'user_rejected'
  | 'timeout'
  | 'unsupported_capability'
  | 'no_active_connection'
  | 'connection_failed';

export class ConnectionDomainError extends Error {
  override readonly cause: unknown;

  constructor(
    readonly code: ConnectionErrorCode,
    message: string,
    cause?: unknown
  ) {
    super(message);
    this.name = 'ConnectionDomainError';
    this.cause = cause;
  }
}
