/* oxlint-disable @typescript-eslint/no-namespace */

// These render an instant in the reader's time zone. A date without a time is not an
// instant: it goes through formatDateOnly, in date-only.util.ts
export const frFormat = {
  date: {
    zonedDateShort: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    } satisfies Intl.DateTimeFormatOptions,
  },
  time: {
    zonedTimeShort: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    } satisfies Intl.DateTimeFormatOptions,
  },
} as const;

type FondationFormat = typeof frFormat;

declare global {
  namespace FormatjsIntl {
    interface Formats {
      date: keyof FondationFormat['date'];
      time: keyof FondationFormat['time'];
    }
  }
}
