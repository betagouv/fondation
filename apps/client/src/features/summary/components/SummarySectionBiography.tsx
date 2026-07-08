import { useSummary } from '@/features/summary/context/SummaryContext';

import { SummarySectionCard } from './SummarySectionCard';

export function SummarySectionBiography() {
  const { summary } = useSummary();

  return (
    <SummarySectionCard id={'biographie'}>
      <h2>Biographie</h2>

      {summary.biography ? (
        <ul className="list-inside list-['-_'] space-y-2">
          {summary.biography
            .trim()
            .split('- ')
            .map((part) => part.trim())
            .filter((x) => !!x)
            .map((part, i) => (
              <li key={`biography_list_${i}`}>{part}</li>
            ))}
        </ul>
      ) : (
        <span className="text-(--text-mention-grey)">N/A</span>
      )}
    </SummarySectionCard>
  );
}
