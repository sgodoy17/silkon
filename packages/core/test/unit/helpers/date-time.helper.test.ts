import { Country } from '@silkon/common';
import { DateTimeHelper } from '../../../src';

describe('DateTimeHelper', () => {
  const now = new Date('2026-08-05T18:03:09.000Z');

  const mockDateTimeFormat = (timeZoneName: string = 'GMT-04:00') => {
    const formatToParts = jest.fn((date: Date) => [
      { type: 'year', value: String(date.getUTCFullYear()) },
      { type: 'month', value: String(date.getUTCMonth() + 1).padStart(2, '0') },
      { type: 'day', value: String(date.getUTCDate()).padStart(2, '0') },
      { type: 'hour', value: String(date.getUTCHours()).padStart(2, '0') },
      { type: 'minute', value: String(date.getUTCMinutes()).padStart(2, '0') },
      { type: 'second', value: String(date.getUTCSeconds()).padStart(2, '0') },
      { type: 'timeZoneName', value: timeZoneName },
    ]);

    return jest
      .spyOn(Intl, 'DateTimeFormat')
      .mockImplementation((() => ({ formatToParts })) as unknown as typeof Intl.DateTimeFormat);
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('formats the current date in the configured locale and timezone', () => {
    const dateTimeFormatSpy = mockDateTimeFormat();

    const result = DateTimeHelper.now(Country.CL);

    expect(result).toBe('2026-08-05T18:03:09-04:00');
    expect(dateTimeFormatSpy).toHaveBeenCalledWith(
      'es-CL',
      expect.objectContaining({
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'longOffset',
      }),
    );
  });

  it('calculates the difference in seconds between two timestamps in the same country timezone', () => {
    mockDateTimeFormat();

    expect(DateTimeHelper.getDiff('2026-08-05T10:00:00-04:00', '2026-08-05T10:01:30-04:00')).toBe(
      90,
    );
  });

  it.each([
    ['seconds', 30, '2026-08-05T12:00:30.000Z'],
    ['minutes', 2, '2026-08-05T12:02:00.000Z'],
    ['hours', 3, '2026-08-05T15:00:00.000Z'],
    ['days', 1, '2026-08-06T12:00:00.000Z'],
    ['months', 1, '2026-09-05T12:00:00.000Z'],
    ['years', 1, '2027-08-05T12:00:00.000Z'],
  ] as const)('calculates expiration for %s', (unit, ttl, expected) => {
    jest.setSystemTime(new Date('2026-08-05T12:00:00.000Z'));

    expect(DateTimeHelper.expiration(ttl, unit).toISOString()).toBe(expected);
  });

  it('should set the fixed date at 7:15', () => {
    jest.setSystemTime(new Date('2026-08-05T20:00:00.000Z'));

    expect(
      DateTimeHelper.expiration(1, 'days', { fixed: true, hour: 7, min: 15 }).toISOString(),
    ).toBe('2026-08-06T11:15:00.000Z');
  });

  it('throws for unsupported ttl units', () => {
    expect(() => DateTimeHelper.expiration(1, 'centuries' as never)).toThrow(
      'Unsupported TTL unit: centuries',
    );
  });

  it.each([
    ['2026-05-19 10:42:07', '2026-05-19T10:42:07-04:00'],
    ['2026-08-05 12:00:30', '2026-08-05T12:00:30-04:00'],
    ['2026-10-30 13:11:43', '2026-10-30T13:11:43-03:00'],
    ['2026-09-10 12:00:00', '2026-09-10T12:00:00-03:00'],
    ['2027-04-10 12:00:00', '2027-04-10T12:00:00-04:00'],
  ])('adds the T and the offset to %s', (input, expected) => {
    expect(DateTimeHelper.offset(input)).toBe(expected);
  });

  it('accepts a T separator and trims the input', () => {
    expect(DateTimeHelper.offset('  2026-05-19T10:42:07  ')).toBe('2026-05-19T10:42:07-04:00');
  });

  it('keeps the digits as written and ignores milliseconds and Z', () => {
    expect(DateTimeHelper.offset('2026-08-05T12:00:30.000Z')).toBe('2026-08-05T12:00:30-04:00');
  });

  it('does not depend on the system time', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2030-01-01T00:00:00.000Z'));

    expect(DateTimeHelper.offset('2026-10-30 13:11:43')).toBe('2026-10-30T13:11:43-03:00');

    jest.useRealTimers();
  });

  it('uses Chile as the default country', () => {
    expect(DateTimeHelper.offset('2026-10-30 13:11:43', Country.CL)).toBe(
      DateTimeHelper.offset('2026-10-30 13:11:43'),
    );
  });

  it.each([[''], ['not a date'], ['2026-05-19'], ['2026-05-19 10:42'], ['2026-13-45 10:00:00']])(
    'throws for invalid input "%s"',
    input => {
      expect(() => DateTimeHelper.offset(input)).toThrow(`Invalid date: ${input}`);
    },
  );
});
