import React, { useContext } from 'react';

import type { Override } from '@/utils/types.util';
import type { DetailedSummaryDto } from '@api/types';

type SummaryContextType = {
  canWriteSummary: boolean;
  nominationFileId: string;
  sessionId: string;
  summary: DetailedSummaryDto | null;
};

export const SummaryContext = React.createContext<SummaryContextType>(null as unknown as SummaryContextType);

export function useSummary(): Override<SummaryContextType, { summary: DetailedSummaryDto }> {
  return useContext(SummaryContext) as Override<SummaryContextType, { summary: DetailedSummaryDto }>;
}
