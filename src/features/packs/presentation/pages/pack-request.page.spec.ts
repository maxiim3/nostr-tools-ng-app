import '@angular/compiler';

import { HttpErrorResponse } from '@angular/common/http';

import { resolveRequestStatus, resolveSubmitErrorKey } from './pack-request.page';
import type { UserRequestState } from '../../application/starter-pack-request.service';

describe('PackRequestPage pure helpers', () => {
  describe('resolveRequestStatus', () => {
    it('returns idle when user is a pack member', () => {
      const state: UserRequestState = { status: 'pending' };

      expect(resolveRequestStatus(state, true)).toBe('idle');
    });

    it('returns pending when state is pending and user is not a pack member', () => {
      const state: UserRequestState = { status: 'pending' };

      expect(resolveRequestStatus(state, false)).toBe('pending');
    });

    it('returns idle when state is idle and user is not a pack member', () => {
      const state: UserRequestState = { status: 'idle' };

      expect(resolveRequestStatus(state, false)).toBe('idle');
    });

    it('returns idle when state is approved but user is not a pack member', () => {
      const state: UserRequestState = { status: 'approved' };

      expect(resolveRequestStatus(state, false)).toBe('idle');
    });
  });

  describe('resolveSubmitErrorKey', () => {
    it('returns authError for 401 HttpErrorResponse', () => {
      const error = new HttpErrorResponse({ status: 401 });

      expect(resolveSubmitErrorKey(error)).toBe('request.submitError.authError');
    });

    it('returns forbidden for 403 HttpErrorResponse', () => {
      const error = new HttpErrorResponse({ status: 403 });

      expect(resolveSubmitErrorKey(error)).toBe('request.submitError.forbidden');
    });

    it('returns invalidRequest for 400 HttpErrorResponse', () => {
      const error = new HttpErrorResponse({ status: 400 });

      expect(resolveSubmitErrorKey(error)).toBe('request.submitError.invalidRequest');
    });

    it('returns generic submitError for other HttpErrorResponse', () => {
      const error = new HttpErrorResponse({ status: 500 });

      expect(resolveSubmitErrorKey(error)).toBe('request.submitError.generic');
    });

    it('returns generic submitError for non-HttpErrorResponse', () => {
      expect(resolveSubmitErrorKey(new Error('network'))).toBe('request.submitError.generic');
    });
  });
});
