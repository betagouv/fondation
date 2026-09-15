export function splitLodamObservers(observers: readonly string[]): string[] | null {
  if (observers.length === 0) return null;

  return observers.flatMap((observer) => observer.split('\n'));
}
