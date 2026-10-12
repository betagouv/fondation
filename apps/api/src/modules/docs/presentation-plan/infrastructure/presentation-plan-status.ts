import z from 'zod';

import { isDefined } from 'src/utils/is-defined';

const PRESENTATION_PLAN_STATUSES = ['DRAFT', 'VALIDATED'] as const;

export type PresentationPlanStatus = (typeof PRESENTATION_PLAN_STATUSES)[number];

export const presentationPlanStatusSchema = z.enum(PRESENTATION_PLAN_STATUSES);

/** reading a notice writes its html and every edit drops its pdf, so the stored pdf alone tells a validated notice */
export function presentationPlanStatusOf(plan: { pdfId: string | null }): PresentationPlanStatus {
  return isDefined(plan.pdfId) ? 'VALIDATED' : 'DRAFT';
}
