import { Outlet } from 'react-router';
import { PresentationPlanProvider } from './contexts/PresentationPlanProvider';

export function PresentationsLayout() {
  return (
    <PresentationPlanProvider>
      <Outlet />
    </PresentationPlanProvider>
  );
}
