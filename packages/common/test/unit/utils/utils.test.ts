import {
  isArray,
  isBoolean,
  isError,
  isNil,
  isNumber,
  isObject,
  isString,
  isUndefined,
} from '../../../src';

describe('common utils', () => {
  it('identifies arrays', () => {
    expect(isArray([])).toBe(true);
    expect(isArray({})).toBe(false);
  });

  it('identifies booleans', () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean('true')).toBe(false);
  });

  it('identifies errors', () => {
    expect(isError(new Error('boom'))).toBe(true);
    expect(isError({ message: 'boom' })).toBe(false);
  });

  it('identifies nil values', () => {
    expect(isNil(null)).toBe(true);
    expect(isNil(undefined)).toBe(true);
    expect(isNil(0)).toBe(false);
  });

  it('identifies numbers', () => {
    expect(isNumber(42)).toBe(true);
    expect(isNumber('42')).toBe(false);
  });

  it('identifies objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(true);
    expect(isObject(null)).toBe(false);
  });

  it('identifies strings', () => {
    expect(isString('silkon')).toBe(true);
    expect(isString(123)).toBe(false);
  });

  it('identifies undefined values', () => {
    expect(isUndefined(undefined)).toBe(true);
    expect(isUndefined(null)).toBe(false);
  });
});
