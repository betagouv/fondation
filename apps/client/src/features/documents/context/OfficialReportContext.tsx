import { createContext, useContext } from 'react';

import type { OfficialReportContextType } from './OfficialReportContext.types';

export const OfficialReportContext = createContext<OfficialReportContextType | null>(null);

export function useOfficialReport(): OfficialReportContextType {
  const ctx = useContext(OfficialReportContext);
  if (!ctx) throw new Error('useOfficialReport must be used within OfficialReportProvider');
  return ctx;
}
