import { generatePath } from 'react-router';

import type { FeedbackStatusEnum } from '@/shared/enums/feedback-status.enum';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

const SLUGS: Record<FeedbackStatusEnum, string> = {
  ACKNOWLEDGED: 'pris-en-compte',
  DISMISSED: 'ecartes',
  NEW: 'nouveaux',
  PROCESSED: 'traites',
};

export function feedbackStatusPath(status: FeedbackStatusEnum): string {
  return generatePath(ROUTE_PATHS.ADMIN.FEEDBACKS_STATUS, { status: SLUGS[status] });
}

export function feedbackStatusOf(slug: string | undefined): FeedbackStatusEnum | undefined {
  return (Object.keys(SLUGS) as FeedbackStatusEnum[]).find((status) => SLUGS[status] === slug);
}
