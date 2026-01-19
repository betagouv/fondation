import React from 'react';

import { SummaryContext } from '@/pages/summary/SummaryContext';
import type { SummarySectionAnchor } from '../useVisibleSummarySections';
import clsx from 'clsx';

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
    <section id={props.id} className={clsx('rounded-lg bg-white', !props.disablePadding && 'px-6 py-4')}>
      {props.children}
    </section>
  );
}
