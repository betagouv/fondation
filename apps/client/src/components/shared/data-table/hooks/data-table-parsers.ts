/* oxlint-disable @typescript-eslint/no-explicit-any */

import { createParser } from 'nuqs';

export const parseAsKeyValue = createParser({
  parse: (value) => {
    const [key, jsonEncodedValue] = value.split(':');
    if (!key || !jsonEncodedValue) return null;

    return { id: key, value: JSON.parse(jsonEncodedValue) };
  },
  serialize: ({ id, value }: { id: string; value: any }) => {
    if (value === undefined || value === null) return '';

    return `${id}:${JSON.stringify(value)}`;
  },
});

export const parseAsFilters = createParser({
  /** @warning this might come with some heavy performance penalty */
  eq: (a, b) => a.length === b.length && JSON.stringify(a) === JSON.stringify(b),

  parse: (queryString: string) =>
    queryString
      .split(',')
      .map(parseAsKeyValue.parse)
      .filter((x) => x !== null),

  serialize: (values: { id: string; value: any }[]) => values.map(parseAsKeyValue.serialize).join(','),
});
