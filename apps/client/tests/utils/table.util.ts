import * as assert from 'node:assert/strict';

/**
 * @example
 * ```
 * const got = table<{ fizz: string; buzz: number }>`
 *  fizz    | buzz
 *  ${'1'} | ${2}
 * `
 *
 * got // { fizz: string; buzz: number }[]
 * ```
 */
export function table<T extends Record<string, unknown> = Record<string, unknown>>(
  template: TemplateStringsArray,
  ...args: T[keyof T][]
): T[] {
  const headers: readonly string[] = template[0].split('|').map((x) => x.trim());
  assert.ok(
    args.length % headers.length === 0,
    `Expected the same amount of parameters as headers. ${headers.length} expected, ${args.length % headers.length} provided.`
  );

  const output: Record<string, unknown>[] = [];
  while (args.length) {
    output.push(Object.fromEntries(headers.map((h) => [h, args.shift()])));
  }

  return output as T[];
}
