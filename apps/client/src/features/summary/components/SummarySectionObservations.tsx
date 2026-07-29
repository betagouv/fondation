import { FormattedMessage } from 'react-intl';

import { useSummary } from '@/features/summary/context/SummaryContext';
import { fullNameUpperCase } from '@/utils/user.utils';

import { SummarySectionCard } from './SummarySectionCard';

export function SummarySectionObservations() {
  const { summary } = useSummary();

  const hasAnyObservation = summary.observers.length > 0 || summary.observations.length > 0;
  if (!hasAnyObservation) {
    return null;
  }

  return (
    <SummarySectionCard id="observants">
      <h2>
        <FormattedMessage defaultMessage="Observant(s)" />
      </h2>

      <ul className="list-['-_']">
        {summary.observers.map((observer) => (
          <li key={observer}>{observer}</li>
        ))}

        {/* TODO: add link to observation detail*/}
        {summary.observations.map(({ magistrat }) => (
          <li key={magistrat.id}>{fullNameUpperCase(magistrat)}</li>
        ))}
      </ul>
    </SummarySectionCard>
  );
}
