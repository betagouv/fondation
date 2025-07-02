import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HomePage } from '../HomePage';

import { SecretariatGeneralPage } from '../pages/secretariat-general/SecretariatGeneralPage';
import { LoginPage } from '../pages/LoginPage';
import { NouvelleTransparencePage } from '../pages/secretariat-general/NouvelleTransparencePage';
import { AuthGuard } from '../components/guards/AuthGuard';
import { Outlet } from 'react-router-dom';
import { TransparencesLayout } from '../pages/transparence/TransparencesLayout';
import { ROUTE_PATHS } from '../utils/route-path.utils';
import { TransparencesPage } from '../pages/transparence/TransparencesPage';
import ReportList from '../components/reports/components/ReportList/ReportList';
import ReportListPage from '../components/reports/components/ReportList/ReportListPage';

// Layout pour les routes protégées du secretariat général
const SecretariatGeneralLayout = () => (
  <AuthGuard>
    <Outlet />
  </AuthGuard>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    children: [
      {
        path: ROUTE_PATHS.LOGIN,
        element: <LoginPage />
      },
      {
        path: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
        element: <TransparencesLayout />,
        children: [
          {
            index: true,
            element: <TransparencesPage />
          },
          {
            path: ROUTE_PATHS.TRANSPARENCES.DETAILS_GDS,
            element: <ReportListPage />
          }
        ]
      },
      {
        path: ROUTE_PATHS.SG.DASHBOARD,
        element: <SecretariatGeneralLayout />,
        children: [
          {
            index: true,
            element: <SecretariatGeneralPage />
          },
          {
            path: ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE,
            element: <NouvelleTransparencePage />
          }
        ]
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
