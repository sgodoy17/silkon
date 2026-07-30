import { GeneralException } from '@silkon/common';

import { BaseException, ErrorHelper } from '../../../src';

describe('ErrorHelper', () => {
  it('extracts message and type from errors', () => {
    const error = new Error('boom');

    expect(ErrorHelper.getMessage(error)).toBe('boom');
    expect(ErrorHelper.getType(error)).toBe('Error');
  });

  it('falls back to a generic message when input is not an error', () => {
    expect(ErrorHelper.getMessage({})).toBe('An unknown error occurred');
    expect(ErrorHelper.getType({})).toBe('UNKNOWN_ERROR');
  });

  it('returns exception context when available', () => {
    const error = new BaseException('boom', 'create-user');

    expect(ErrorHelper.getContext(error)).toBe('create-user');
    expect(ErrorHelper.getContext(error, 'fallback')).toBe('create-user');
  });

  it('returns fallback context for non-framework errors', () => {
    const error = new Error('boom');

    expect(ErrorHelper.getContext(error, 'fallback')).toBe('fallback');
  });

  it('throws a GeneralException from quickError', () => {
    expect(() => ErrorHelper.quickError('boom')).toThrow(GeneralException);
    expect(() => ErrorHelper.quickError('boom')).toThrow('boom');
  });
});
