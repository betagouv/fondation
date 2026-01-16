import React from 'react';

import { SummaryContext } from '@/pages/summary/SummaryContext';
import type { SummarySectionAnchor } from '../useVisibleSummarySections';

export function SummarySectionCard(props: { id: SummarySectionAnchor; children: React.ReactNode }) {
  const { showSection } = React.useContext(SummaryContext);
  React.useEffect(() => {
    showSection(props.id);
  }, [showSection, props.id]);

  return (
    <section id={props.id} className="rounded-lg bg-white px-6 py-4">
      {props.children}
    </section>
  );
}
