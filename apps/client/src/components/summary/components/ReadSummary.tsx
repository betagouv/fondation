import { useSummary } from '@/pages/summary/SummaryContext';

export function ReadSummary() {
  const { summary } = useSummary();

  return <p>Read Summary {summary.id}</p>;
}
