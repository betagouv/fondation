import { FormattedMessage } from 'react-intl';

import { useSummary } from '@/features/summary/context/SummaryContext';
import { fullNameUpperCase } from '@/utils/user.utils';

import { SummarySectionCard } from './SummarySectionCard';

export function SummarySectionObservations() {
  const { summary } = useSummary();

  const observantsCount = summary.observers.length + summary.observations.length;
  if (observantsCount === 0) {
    return null;
  }

  return (
    <SummarySectionCard id="observants">
      <h2>
        <FormattedMessage
          defaultMessage="{count, plural, one {Observant} other {Observants ({count})}}"
          values={{ count: observantsCount }}
        />
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
