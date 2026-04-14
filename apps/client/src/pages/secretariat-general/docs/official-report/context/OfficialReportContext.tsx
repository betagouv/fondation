import React from 'react';

import type { OfficialReportContextType } from './OfficialReportContext.types';

export const OfficialReportContext = React.createContext<OfficialReportContextType | null>(null);

export function useOfficialReport(): OfficialReportContextType {
  const ctx = React.useContext(OfficialReportContext);
  if (!ctx) throw new Error('useOfficialReport must be used within OfficialReportProvider');
  return ctx;
}
