export function formatJobDate(dateString: string | null): string | null {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (!Number.isFinite(date.getTime())) return null;

  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
