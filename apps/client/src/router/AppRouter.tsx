import * as Sentry from '@sentry/react';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { LolfiRedirectMagistrat } from '@/pages/LolfiRedirectMagistratPage';
import { HelpPage } from '@/pages/help/HelpPage';
import { UserManualPage } from '@/pages/help/UserManualPage';
import { SummaryPage } from '@/pages/summary/SummaryPage';
import { HomePage } from '../HomePage';
import ReportListPage from '../components/reports/components/ReportList/ReportListPage';
import ReportOverviewPage from '../components/reports/components/ReportOverview/ReportOverviewPage';
import { LoginPage } from '../pages/LoginPage';
import { ManageSessionPage } from '../pages/secretariat-general/ManageSessionPage';
import { MemberListPage } from '../pages/secretariat-general/MemberListPage';
import { NouvelleTransparencePage } from '../pages/secretariat-general/NouvelleTransparencePage';
import { SecretariatGeneralPage } from '../pages/secretariat-general/SecretariatGeneralPage';
import { SecretariatGeneralLayout } from '../pages/secretariat-general/SecretariatLayout';
import { TransparencePage } from '../pages/secretariat-general/TransparencePage';
import { DetailsMemberPage } from '../pages/secretariat-general/membres/DetailsMemberPage';
import { ObservationDetailsPage } from '../pages/secretariat-general/observations/ObservationDetailsPage';
import { SessionsPage } from '../pages/transparence/SessionsPage';
import { TransparencesLayout } from '../pages/transparence/TransparencesLayout';
import { ROUTE_PATHS } from '../utils/route-path.utils';
import { AppErrorBoundary } from './AppErrorBoundary';

const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouterV7(createBrowserRouter);
const router = sentryCreateBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    errorElement: <AppErrorBoundary />,
    children: [
      {
        path: '/',
        element: <LoginPage />,
        index: true
      },
      {
        path: ROUTE_PATHS.LOGIN,
        element: <LoginPage />
      },
      {
        path: ROUTE_PATHS.HELP,
        element: <HelpPage />
      },
      {
        path: ROUTE_PATHS.USER_MANUAL,
        element: <UserManualPage />
      },
      {
        path: ROUTE_PATHS.HELP,
        element: <HelpPage />
      },
      {
        path: ROUTE_PATHS.SUMMARY,
        element: <SummaryPage />
      },
      {
        path: ROUTE_PATHS.REDIRECT_MAGISTRAT_LOLFI,
        element: <LolfiRedirectMagistrat />
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
            path: ROUTE_PATHS.TRANSPARENCES.OBSERVATION_DETAILS,
            element: <ObservationDetailsPage />
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
            path: ROUTE_PATHS.SG.OBSERVATION_DETAILS,
            element: <ObservationDetailsPage />
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_SESSION,
            element: <ManageSessionPage />
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_MEMBERS,
            element: <MemberListPage />
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER,
            element: <DetailsMemberPage />
          }
        ]
      }
    ]
  }
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
