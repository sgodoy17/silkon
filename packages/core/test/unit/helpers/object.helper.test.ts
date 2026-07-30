import { ObjectHelper } from '../../../src';

describe('ObjectHelper', () => {
  it('validates nested keys', () => {
    const data = {
      config: {
        port: 3000,
      },
    };

    expect(ObjectHelper.isValid(data, 'config.port')).toBe(true);
    expect(ObjectHelper.isValid(data, 'config.host')).toBe(false);
    expect(ObjectHelper.isValid(null, 'config.port')).toBe(false);
  });

  it('returns nested values', () => {
    const data = {
      config: {
        port: '3000',
        enabled: 'true',
        tags: ['core'],
      },
    };

    expect(ObjectHelper.getValue<string>(data, 'config.port')).toBe('3000');
    expect(ObjectHelper.getValue<number>(data, 'config.port', true)).toBe(3000);
    expect(ObjectHelper.getValue<boolean>(data, 'config.enabled', true)).toBe(true);
    expect(ObjectHelper.getValue<string[]>(data, 'config.tags', true)).toEqual(['core']);
    expect(ObjectHelper.getValue(data, 'config.missing')).toBeUndefined();
  });
});
