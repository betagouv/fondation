/* oxlint-disable @typescript-eslint/no-explicit-any */

import { createParser } from 'nuqs';

const parseAsKeyValue = createParser({
  parse: (value) => {
    const separator = value.indexOf(':');
    const jsonEncodedValue = value.slice(separator + 1);
    if (separator <= 0 || !jsonEncodedValue) return null;

    try {
      return { id: value.slice(0, separator), value: JSON.parse(jsonEncodedValue) };
    } catch {
      return null;
    }
  },
  serialize: ({ id, value }: { id: string; value: any }) => {
    if (value === undefined || value === null) return '';

    return `${id}:${JSON.stringify(value)}`;
  },
});

/** the filters are joined by commas, which a JSON value holds too: only those outside of it separate */
function splitFilters(queryString: string): string[] {
  const filters: string[] = [];
  let depth = 0;
  let inString = false;
  let start = 0;

  for (let index = 0; index < queryString.length; index++) {
    const char = queryString[index];
    if (inString) {
      if (char === '\\') index++;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === '[' || char === '{') depth++;
    else if (char === ']' || char === '}') depth--;
    else if (char === ',' && depth === 0) {
      filters.push(queryString.slice(start, index));
      start = index + 1;
    }
  }

  return [...filters, queryString.slice(start)];
}

export const parseAsFilters = createParser({
  /** @warning this might come with some heavy performance penalty */
  eq: (a, b) => a.length === b.length && JSON.stringify(a) === JSON.stringify(b),

  parse: (queryString: string) =>
    splitFilters(queryString)
      .map(parseAsKeyValue.parse)
      .filter((x) => x !== null),

  serialize: (values: { id: string; value: any }[]) => values.map(parseAsKeyValue.serialize).join(','),
});
