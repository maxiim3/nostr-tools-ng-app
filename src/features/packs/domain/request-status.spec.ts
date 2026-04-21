import {
  resolveAdminRequestStatus,
  resolveUserRequestStatus,
} from './request-status';

describe('request status helpers', () => {
  it('returns idle for user when there is no request and no decision', () => {
    expect(resolveUserRequestStatus(null, null)).toBe('idle');
  });

  it('returns approved for user when there is an approval and no request', () => {
    expect(resolveUserRequestStatus(null, { createdAt: 30, status: 'approved' })).toBe('approved');
  });

  it('returns idle for user when there is only a rejection', () => {
    expect(resolveUserRequestStatus(null, { createdAt: 30, status: 'rejected' })).toBe('idle');
  });

  it('returns pending for user when there is a request and no decision', () => {
    expect(resolveUserRequestStatus({ createdAt: 30 }, null)).toBe('pending');
  });

  it('returns pending when a request is newer than any decision', () => {
    expect(resolveUserRequestStatus({ createdAt: 30 }, { createdAt: 20, status: 'rejected' })).toBe(
      'pending',
    );
  });

  it('returns pending when a request is newer than an approval', () => {
    expect(resolveUserRequestStatus({ createdAt: 30 }, { createdAt: 20, status: 'approved' })).toBe(
      'pending',
    );
  });

  it('returns approved when the latest decision approves the request', () => {
    expect(resolveUserRequestStatus({ createdAt: 20 }, { createdAt: 30, status: 'approved' })).toBe('approved');
  });

  it('returns approved when request and approval have the same timestamp', () => {
    expect(resolveUserRequestStatus({ createdAt: 30 }, { createdAt: 30, status: 'approved' })).toBe(
      'approved',
    );
  });

  it('returns idle when a rejection is newer than the latest request', () => {
    expect(resolveUserRequestStatus({ createdAt: 20 }, { createdAt: 30, status: 'rejected' })).toBe('idle');
  });

  it('returns idle when request and rejection have the same timestamp', () => {
    expect(resolveUserRequestStatus({ createdAt: 30 }, { createdAt: 30, status: 'rejected' })).toBe('idle');
  });

  it('returns pending for admin when there is no decision yet', () => {
    expect(resolveAdminRequestStatus({ createdAt: 10 }, null)).toBe('pending');
  });

  it('returns pending for admin when request is newer than decision', () => {
    expect(resolveAdminRequestStatus({ createdAt: 20 }, { createdAt: 10, status: 'approved' })).toBe(
      'pending',
    );
  });

  it('returns approved for admin when approval is latest', () => {
    expect(resolveAdminRequestStatus({ createdAt: 10 }, { createdAt: 20, status: 'approved' })).toBe(
      'approved',
    );
  });

  it('returns decision status for admin when timestamps are equal', () => {
    expect(resolveAdminRequestStatus({ createdAt: 20 }, { createdAt: 20, status: 'approved' })).toBe(
      'approved',
    );
  });

  it('returns rejected for admin when timestamps are equal and decision is rejected', () => {
    expect(resolveAdminRequestStatus({ createdAt: 20 }, { createdAt: 20, status: 'rejected' })).toBe(
      'rejected',
    );
  });

  it('returns rejected for admin when the latest decision rejects', () => {
    expect(resolveAdminRequestStatus({ createdAt: 10 }, { createdAt: 20, status: 'rejected' })).toBe('rejected');
  });
});
