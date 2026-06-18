import React, { useContext } from 'react';

import type { PresentPlanModalContextType } from './present-plan-modal.type';

export const PresentPlanModalContext = React.createContext<PresentPlanModalContextType>(
  null as unknown as PresentPlanModalContextType,
);

export function usePresentPlanModal(): PresentPlanModalContextType {
  const ctx = useContext(PresentPlanModalContext);
  if (!ctx) throw new Error(`Unknown PresentPlanModalContext`);

  return ctx;
}
