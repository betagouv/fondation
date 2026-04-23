import React from 'react';

import type { PresentationPlanContextType } from './presentation-plan.type';

/** @internal */
export const PresentationPlanContext = React.createContext(null as unknown as PresentationPlanContextType);

export function usePresentationPlan(): PresentationPlanContextType {
  const ctx = React.useContext(PresentationPlanContext);
  if (!ctx) throw new Error(`Unknown PresentationPlanContext`);

  return ctx;
}
