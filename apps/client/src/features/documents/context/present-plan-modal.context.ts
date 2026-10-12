import { createContext, useContext } from 'react';

export type PresentedPlan = { name: string; planId: string; startTime: { hours: number; minutes: number } };

type PresentPlanModalContextType = {
  presentPlans: (plans: readonly PresentedPlan[]) => void;
};

/** @internal */
export const PresentPlanModalContext = createContext<PresentPlanModalContextType | null>(null);

export function usePresentPlanModal() {
  const context = useContext(PresentPlanModalContext);
  if (!context) throw new Error('usePresentPlanModal must be used within a PresentPlanModalProvider');

  return context;
}
