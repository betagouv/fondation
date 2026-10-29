/** the presented notice is the one the DSJ received: rewriting it would drop the pdf that left */
export function canEditPresentationPlan(plan: { isPresented: boolean }): boolean {
  return !plan.isPresented;
}

export function canPresentPlan(plan: { isPresented: boolean; isValidated: boolean }): boolean {
  return plan.isValidated && !plan.isPresented;
}
