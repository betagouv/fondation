/* oxlint-disable @typescript-eslint/no-namespace */

export const frFormat = {
  date: {
    dateOnlyShort: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    } satisfies Intl.DateTimeFormatOptions,
  },
  time: {
    timeOnlyShort: {
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
