import {
  resolveAdminRequestStatus,
  resolveUserRequestStatus
} from './request-status';

describe('request status helpers', () => {
  it('returns pending when a request is newer than any decision', () => {
    expect(resolveUserRequestStatus({ createdAt: 30 }, { createdAt: 20, status: 'rejected' })).toBe('pending');
  });

  it('returns approved when the latest decision approves the request', () => {
    expect(resolveUserRequestStatus({ createdAt: 20 }, { createdAt: 30, status: 'approved' })).toBe('approved');
  });

  it('returns idle when a rejection is newer than the latest request', () => {
    expect(resolveUserRequestStatus({ createdAt: 20 }, { createdAt: 30, status: 'rejected' })).toBe('idle');
  });

  it('returns pending for admin when there is no decision yet', () => {
    expect(resolveAdminRequestStatus({ createdAt: 10 }, null)).toBe('pending');
  });

  it('returns rejected for admin when the latest decision rejects', () => {
    expect(resolveAdminRequestStatus({ createdAt: 10 }, { createdAt: 20, status: 'rejected' })).toBe('rejected');
  });
});
