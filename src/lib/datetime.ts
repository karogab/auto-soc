/** IANA zone: sign is inverted — `Etc/GMT-4` is UTC+04:00. */
export const DISPLAY_TIMEZONE_UTC_PLUS_4 = "Etc/GMT-4" as const;

/** Swedish locale yields `YYYY-MM-DD` and pairs cleanly with 24-hour times. */
const locale = "sv-SE";

const dateTime: Intl.DateTimeFormatOptions = {
  timeZone: DISPLAY_TIMEZONE_UTC_PLUS_4,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Date and time in UTC+4, 24-hour clock (`YYYY-MM-DD HH:mm`). */
export function formatDateTimeUtcPlus4(value: Date | string | number): string {
  return new Intl.DateTimeFormat(locale, dateTime).format(toDate(value));
}
