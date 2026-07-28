import { GeneralException } from '../../../src';

describe('GeneralException', () => {
  it('sets the expected error name and message', () => {
    const error = new GeneralException('boom');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('GENERAL_ERROR');
    expect(error.message).toBe('boom');
  });
});
