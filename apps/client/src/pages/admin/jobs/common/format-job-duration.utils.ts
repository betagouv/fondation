import { format, isValid } from 'date-fns';

export function formatJobDuration(node: { startedAt: string | null; endedAt: string | null }): string | null {
  if (!node.startedAt) return null;

  const startAtDate = new Date(node.startedAt);
  const endedAtDate = node.endedAt ? new Date(node.endedAt) : new Date();

  if (!isValid(startAtDate) || !isValid(endedAtDate)) return null;

  return format(new Date(endedAtDate.getTime() - startAtDate.getTime()), 'mm:ss.SSS');
}
