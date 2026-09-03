export function isScriptDivergent(call: {
  fromRelay: boolean;
  announced: string | undefined;
  expected: string | null | undefined;
}): boolean {
  if (!call.fromRelay) return false;
  if (!call.expected) return false;

  return call.announced !== call.expected;
}
