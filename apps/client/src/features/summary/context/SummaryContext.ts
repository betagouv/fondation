import React, { useContext } from 'react';

import type { SummarySectionAnchor } from '@/features/summary/hooks/useVisibleSummarySections';
import type { Override } from '@/types/utils.types';
import type { DetailedSummaryDto } from '@api/types';

type SummaryContextType = {
  sections: readonly { id: SummarySectionAnchor; label: string }[];
  showSection: (id: SummarySectionAnchor) => void;

  sessionId: string;
  nominationFileId: string;
  canWriteSummary: boolean;
  summary: DetailedSummaryDto | null;
};

export const SummaryContext = React.createContext<SummaryContextType>(null as unknown as SummaryContextType);

type HookedSummaryContextType = Omit<
  Override<SummaryContextType, { summary: DetailedSummaryDto }>,
  'sections' | 'hideSection'
>;

export function useSummary(): HookedSummaryContextType {
  return useContext(SummaryContext) as HookedSummaryContextType;
}
