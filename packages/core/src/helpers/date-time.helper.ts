import { Country, Locale, Timezone } from '@silkon/common';

export class DateTimeHelper {
  public static now(country: Country): string {
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

  public static getDiff(country: Country, start: string, end: string): number {
    const startDate = this.parseInTimeZone(start, country);
    const endDate = this.parseInTimeZone(end, country);

    return Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
  }

  private static parseInTimeZone(value: string, country: Country): Date {
    const [date, offset] = value.split('T');
    const [time] = offset.split('-');
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute, second] = time.split(':').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    const formatter = new Intl.DateTimeFormat(Locale[country], {
      timeZone: Timezone[country],
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'longOffset',
    });

    const parts = formatter.formatToParts(utcDate);
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));

    return new Date(`${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}Z`);
  }
}
