// the end of a name stays with the icons that follow it: the married name in parentheses as a whole, otherwise the last word
export function splitNameEnd(name: string): { end: string; start: string } {
  const [, start = '', end = ''] = /^(?:(.*?) +)?(\([^()]*\)|[^ ]*)$/.exec(name.trim()) ?? [];
  return { end, start };
}
