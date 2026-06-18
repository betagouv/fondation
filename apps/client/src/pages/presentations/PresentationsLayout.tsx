import { Outlet } from 'react-router';

import { PresentationPlanProvider } from '@/features/presentations/context/PresentationPlanProvider';

export function PresentationsLayout() {
  return (
    <PresentationPlanProvider>
      <Outlet />
    </PresentationPlanProvider>
  );
}
