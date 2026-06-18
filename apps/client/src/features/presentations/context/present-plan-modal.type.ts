export type PresentPlanModalContextType = {
  presentPlan(state: { planId: string; startTime: { hours: number; minutes: number } }): void;
  buttonProps: { id: string; 'aria-controls': string; 'data-fr-opened': boolean };
};
