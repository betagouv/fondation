import type { FoundMagistrat } from '@queries/magistrats.queries';

export function currentPositionLabel(currentPosition: FoundMagistrat['currentPosition']): string | null {
  return (
    [currentPosition?.function?.label, currentPosition?.jurisdiction.label].filter(Boolean).join(' ') || null
  );
}
