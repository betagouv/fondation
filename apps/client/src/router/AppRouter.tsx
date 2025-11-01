import { createBrowserRouter, Navigate, redirect, RouterProvider } from 'react-router-dom';
import { HomePage } from '../HomePage';
import ReportListPage from '../components/reports/components/ReportList/ReportListPage';
import ReportOverviewPage from '../components/reports/components/ReportOverview/ReportOverviewPage';
import { LoginPage } from '../pages/LoginPage';
import { ManageSessionPage } from '../pages/secretariat-general/ManageSessionPage';
import { NouvelleTransparencePage } from '../pages/secretariat-general/NouvelleTransparencePage';
import { SecretariatGeneralPage } from '../pages/secretariat-general/SecretariatGeneralPage';
import { SecretariatGeneralLayout } from '../pages/secretariat-general/SecretariatLayout';
import { TransparencePage } from '../pages/secretariat-general/TransparencePage';
import { SessionsPage } from '../pages/transparence/SessionsPage';
import { TransparencesLayout } from '../pages/transparence/TransparencesLayout';
import { getDetailSessionGdsPath, ROUTE_PATHS } from '../utils/route-path.utils';
import { UserListPage } from '../pages/secretariat-general/UserListPage';
import { DetailsUserPage } from '../pages/secretariat-general/membres/DetailsUserPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    children: [
      {
        path: '/',
        element: <Navigate to={ROUTE_PATHS.LOGIN} replace />,
        index: true
      },
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
            element: <SessionsPage />
          },
          {
            path: ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS,
            element: <ReportListPage />
          },
          {
            path: ROUTE_PATHS.TRANSPARENCES.DETAILS_REPORTS,
            element: <ReportOverviewPage />
          },
          {
            // Useful in case of bookmarks or history
            path: ROUTE_PATHS.TRANSPARENCES.DETAILS_GDS,
            action: ({ params }) => redirect(getDetailSessionGdsPath({ sessionId: params.sessionId! }))
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
          },
          {
            path: ROUTE_PATHS.SG.SESSION_ID,
            element: <TransparencePage />
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_SESSION,
            element: <ManageSessionPage />
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_MEMBERS,
            element: <UserListPage />
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER,
            element: <DetailsUserPage />
          }
        ]
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
