import { createContext, useContext } from 'react';

import type { PresentationPlanContextType } from './presentation-plan.type';

/** @internal */
export const PresentationPlanContext = createContext(null as unknown as PresentationPlanContextType);

export function usePresentationPlan(): PresentationPlanContextType {
  const ctx = useContext(PresentationPlanContext);
  if (!ctx) throw new Error(`Unknown PresentationPlanContext`);

  return ctx;
}
