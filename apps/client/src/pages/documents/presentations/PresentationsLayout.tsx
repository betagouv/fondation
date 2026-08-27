import { Outlet } from 'react-router';

import { PresentationPlanProvider } from '@/features/documents/context/PresentationPlanProvider';

export function PresentationsLayout() {
  return (
    <PresentationPlanProvider>
      <Outlet />
    </PresentationPlanProvider>
  );
}
