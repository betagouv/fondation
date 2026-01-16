import React, { useContext } from 'react';
import type { DetailedSummaryDto } from '@api/types';
import type { Override } from '@/types/utils.types';

type SummaryContextType = {
  sessionId: string;
  nominationFileId: string;
  summary: DetailedSummaryDto | null;
};

export const SummaryContext = React.createContext<SummaryContextType>(null as unknown as SummaryContextType);

type HookedSummaryContextType = Override<SummaryContextType, { summary: DetailedSummaryDto }>;
export function useSummary(): HookedSummaryContextType {
  return useContext(SummaryContext) as HookedSummaryContextType;
}
