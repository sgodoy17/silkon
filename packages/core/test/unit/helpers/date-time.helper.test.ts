import { Country } from '@silkon/common';

import { DateTimeHelper } from '../../../src';

describe('DateTimeHelper', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('formats the current date in the configured locale and timezone', () => {
    const formatToParts = jest.fn(() => [
      { type: 'year', value: '2026' },
      { type: 'month', value: '08' },
      { type: 'day', value: '05' },
      { type: 'hour', value: '14' },
      { type: 'minute', value: '03' },
      { type: 'second', value: '09' },
      { type: 'timeZoneName', value: 'GMT-04:00' },
    ]);

    const dateTimeFormatSpy = jest
      .spyOn(Intl, 'DateTimeFormat')
      .mockImplementation((() => ({ formatToParts })) as unknown as typeof Intl.DateTimeFormat);

    const result = DateTimeHelper.now(Country.CL);

    expect(result).toBe('2026-08-05T14:03:09-04:00');
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
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((() => ({
      formatToParts(date: Date) {
        return [
          { type: 'year', value: String(date.getUTCFullYear()) },
          { type: 'month', value: String(date.getUTCMonth() + 1).padStart(2, '0') },
          { type: 'day', value: String(date.getUTCDate()).padStart(2, '0') },
          { type: 'hour', value: String(date.getUTCHours()).padStart(2, '0') },
          { type: 'minute', value: String(date.getUTCMinutes()).padStart(2, '0') },
          { type: 'second', value: String(date.getUTCSeconds()).padStart(2, '0') },
          { type: 'timeZoneName', value: 'GMT-04:00' },
        ];
      },
    })) as unknown as typeof Intl.DateTimeFormat);

    expect(DateTimeHelper.getDiff('2026-08-05T10:00:00-04:00', '2026-08-05T10:01:30-04:00')).toBe(
      90,
    );
  });
});
