export type UserRequestStatus = 'idle' | 'pending' | 'approved';
export type AdminRequestStatus = 'pending' | 'approved' | 'rejected';

export interface RequestStamp {
  createdAt: number;
}

export interface DecisionStamp {
  createdAt: number;
  status: Exclude<AdminRequestStatus, 'pending'>;
}

export function resolveUserRequestStatus(
  latestRequest: RequestStamp | null,
  latestDecision: DecisionStamp | null
): UserRequestStatus {
  if (latestDecision?.status === 'approved' && (!latestRequest || latestDecision.createdAt >= latestRequest.createdAt)) {
    return 'approved';
  }

  if (latestRequest && (!latestDecision || latestRequest.createdAt > latestDecision.createdAt)) {
    return 'pending';
  }

  return 'idle';
}

export function resolveAdminRequestStatus(
  latestRequest: RequestStamp,
  latestDecision: DecisionStamp | null
): AdminRequestStatus {
  if (!latestDecision || latestRequest.createdAt > latestDecision.createdAt) {
    return 'pending';
  }

  return latestDecision.status;
}
