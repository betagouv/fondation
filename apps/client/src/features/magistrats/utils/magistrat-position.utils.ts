import type { FoundMagistrat } from '@queries/magistrats.queries';

export function currentPositionLabel(currentPosition: FoundMagistrat['currentPosition']): string | null {
  const court = currentPosition && (currentPosition.jurisdiction.label ?? currentPosition.jurisdiction.id);
  return [currentPosition?.function?.label, court].filter(Boolean).join(' ') || null;
}
