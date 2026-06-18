import React from 'react';

export const SUMMARY_SECTION_ANCHORS = [
  { id: 'magistrat', label: 'Magistrat' },
  { id: 'biographie', label: 'Biographie' },
  { id: 'observants', label: 'Observants' },
  { id: 'synthese', label: 'Synthèse' },
  { id: 'pieces-jointes', label: 'Pièces jointes' },
] as const;

export type SummarySectionAnchor = (typeof SUMMARY_SECTION_ANCHORS)[number]['id'];

/** @internal only used in {@link SummaryPage} */
export function useVisibleSummarySections(): {
  sections: readonly { id: SummarySectionAnchor; label: string }[];
  showSection: (id: SummarySectionAnchor) => void;
} {
  const [sections, setSections] = React.useState(
    SUMMARY_SECTION_ANCHORS.map((section) => ({ ...section, isVisible: false })),
  );

  const showSection = React.useCallback(
    (id: SummarySectionAnchor) => {
      const section = sections.find((s) => s.id === id);
      if (section?.isVisible === false) {
        setSections(sections.map((s) => (s.id === id ? { ...s, isVisible: true } : s)));
      }
    },
    [sections, setSections],
  );

  const visibleSections = sections.filter(({ isVisible }) => isVisible);

  return { sections: visibleSections, showSection };
}
