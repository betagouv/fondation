import { useSummary } from '@/pages/summary/SummaryContext';
import { SummarySectionCard } from './SummarySectionCard';
import { capitalize } from '@/utils/string.utils';

export function SummarySectionObservations() {
  const { summary } = useSummary();

  const hasAnyObservation = summary.observers.length > 0 || summary.observations.length > 0;
  if (!hasAnyObservation) {
    return null;
  }

  return (
    <SummarySectionCard id="observants">
      <h2>Observants</h2>

      <ul className="list-['-_']">
        {summary.observers.map((observer) => (
          <li key={observer}>{observer}</li>
        ))}

        {/* TODO: add link to observation detail*/}
        {summary.observations.map(({ magistrat }) => (
          <li key={magistrat.id}>
            {[
              capitalize(magistrat.firstName),
              magistrat.usedName.toUpperCase(),
              magistrat.lastName.toUpperCase()
            ]
              .filter((x) => !!x.trim())
              .join(' ')}
          </li>
        ))}
      </ul>
    </SummarySectionCard>
  );
}
