import clsx from 'clsx';
import React from 'react';

import { SummaryContext } from '@/features/summary/context/SummaryContext';
import type { SummarySectionAnchor } from '@/features/summary/hooks/useVisibleSummarySections';

export function SummarySectionCard(props: {
  id: SummarySectionAnchor;
  children: React.ReactNode;
  disablePadding?: true;
}) {
  const { showSection } = React.useContext(SummaryContext);
  React.useEffect(() => {
    showSection(props.id);
  }, [showSection, props.id]);

  return (
    <section
      id={props.id}
      className={clsx(
        'rounded-lg bg-(--background-default-grey)',
        !props.disablePadding && 'fr-px-6v fr-py-4v',
      )}
    >
      {props.children}
    </section>
  );
}
