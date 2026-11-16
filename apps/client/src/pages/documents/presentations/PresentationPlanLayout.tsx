import { Outlet, useParams } from 'react-router';

import { PresentationPlanNotFound } from '@/features/documents/components/presentations/PresentationPlanNotFound';
import { isNotFound } from '@/utils/http-exception';
import { useJusticePresentationPlanMetadataQuery } from '@queries/agenda.queries';

// a notice spans the agendas of several sessions: its address carries none, so only the notice is checked
export function PresentationPlanLayout() {
  const { planId } = useParams();

  const plan = useJusticePresentationPlanMetadataQuery({ presentationPlanId: planId });

  // a failed reload keeps the data loaded before: the page stays rather than the error page
  if (plan.error && !isNotFound(plan.error) && !plan.data) throw plan.error;
  if (isNotFound(plan.error)) return <PresentationPlanNotFound />;

  return <Outlet />;
}
