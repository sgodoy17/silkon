import { Country, Locale, Timezone } from '@silkon/common';

import { TtlUnit } from '../types';

export class DateTimeHelper {
  public static now(country: Country = Country.CL): string {
    const date = new Date();

    const parts = new Intl.DateTimeFormat(Locale[country], {
      timeZone: Timezone[country],
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'longOffset',
    }).formatToParts(date);

    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const offset = map.timeZoneName?.slice(3) ?? '';

    return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}${offset}`;
  }

  public static getDiff(start: string, end: string): number {
    const startDate = this.parseInTimeZone(start);
    const endDate = this.parseInTimeZone(end);

    return Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
  }

  public static expiration(ttl: number, unit: TtlUnit = 'seconds', fixed: boolean = false): Date {
    const from = new Date();

    switch (unit) {
      case 'seconds':
        return new Date(from.getTime() + ttl * 1000);
      case 'minutes':
        return new Date(from.getTime() + ttl * 60 * 1000);
      case 'hours':
        return new Date(from.getTime() + ttl * 60 * 60 * 1000);
      case 'days':
        from.setUTCDate(from.getUTCDate() + ttl);

        break;
      case 'months': {
        from.setUTCMonth(from.getUTCMonth() + ttl);

        break;
      }
      case 'years': {
        from.setUTCFullYear(from.getUTCFullYear() + ttl);

        break;
      }
      default:
        throw new Error(`Unsupported TTL unit: ${String(unit)}`);
    }

    if (fixed) {
      from.setUTCHours(7, 15, 0, 0);
    }

    return from;
  }

  public static getTimestamp(): string {
    return String(BigInt(Date.now()) * 1_000_000n + BigInt(process.hrtime()[1]));
  }

  private static parseInTimeZone(value: string): Date {
    const [date, offset] = value.split('T');
    const [time] = offset.split('-');
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute, second] = time.split(':').map(Number);

    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  }

  public static offset(input: string | number | Date, country: Country = Country.CL): string {
    const date = input instanceof Date ? input : new Date(input);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${String(input)}`);
    }

    const parts = new Intl.DateTimeFormat(Locale[country], {
      timeZone: Timezone[country],
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'longOffset',
    }).formatToParts(date);

    const map: Record<string, string> = {};

    for (const part of parts) {
      map[part.type] = part.value;
    }

    const offset = map.timeZoneName.replace('GMT', '') || '+00:00';

    return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}${offset}`;
  }
}
