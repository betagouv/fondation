import * as Sentry from '@sentry/react';
import { createBrowserRouter, RouterProvider } from 'react-router';

import ReportListPage from '../components/reports/components/ReportList/ReportListPage';
import ReportOverviewPage from '../components/reports/components/ReportOverview/ReportOverviewPage';
import { HomePage } from '../HomePage';
import { LoginPage } from '../pages/LoginPage';
import { CreateOrUpdateAgendaPage } from '../pages/secretariat-general/docs/agenda/AgendaPage';
import { ManageSessionPage } from '../pages/secretariat-general/ManageSessionPage';
import { MemberListPage } from '../pages/secretariat-general/MemberListPage';
import { DetailsMemberPage } from '../pages/secretariat-general/membres/DetailsMemberPage';
import { NouvelleTransparencePage } from '../pages/secretariat-general/NouvelleTransparencePage';
import { ObservationDetailsPage } from '../pages/secretariat-general/observations/ObservationDetailsPage';
import { SecretariatGeneralPage } from '../pages/secretariat-general/SecretariatGeneralPage';
import { SecretariatGeneralLayout } from '../pages/secretariat-general/SecretariatLayout';
import { TransparencePage } from '../pages/secretariat-general/TransparencePage';
import { SessionsPage } from '../pages/transparence/SessionsPage';
import { TransparencesLayout } from '../pages/transparence/TransparencesLayout';
import { ROUTE_PATHS } from '../utils/route-path.utils';
import { TableauDeBordEditTransparencePage } from '@/components/secretariat-general/transparence/content/tableau-de-bord/resume/TableauDeBordEditTransparence';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { IngestLolfiArchivePage } from '@/pages/admin/ingest/IngestLolfiArchivePage';
import { DetailsJobPage } from '@/pages/admin/jobs/DetailsJobPage';
import { JobsPage } from '@/pages/admin/jobs/JobsPage';
import { AdminUserDetailPage } from '@/pages/admin/users/AdminUserDetailPage';
import { AdminUserListPage } from '@/pages/admin/users/AdminUserListPage';
import { HelpPage } from '@/pages/help/HelpPage';
import { UserManualPage } from '@/pages/help/UserManualPage';
import { LolfiRedirectMagistrat } from '@/pages/LolfiRedirectMagistratPage';
import { AgendaPreviewPage } from '@/pages/secretariat-general/docs/agenda/AgendaPreviewPage';
import { CreateOrUpdateOfficialReportPage } from '@/pages/secretariat-general/docs/official-report/OfficialReportPage';
import { OfficialReportPreviewPage } from '@/pages/secretariat-general/docs/official-report/OfficialReportPreviewPage';
import { PresentationsLayout } from '@/pages/secretariat-general/presentations/PresentationsLayout';
import { PresentationPreviewPage } from '@/pages/secretariat-general/presentations/PresentationsPreviewPage';
import { PresentationsTabPast } from '@/pages/secretariat-general/presentations/PresentationsTabPast';
import { PresentationsTabReady } from '@/pages/secretariat-general/presentations/PresentationsTabReady';
import { PresentationsTabsPage } from '@/pages/secretariat-general/presentations/PresentationsTabsPage';
import { PresentationUpsertPage } from '@/pages/secretariat-general/presentations/PresentationUpsertPage';
import { SummaryPage } from '@/pages/summary/SummaryPage';

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
        index: true,
      },
      {
        path: ROUTE_PATHS.LOGIN,
        element: <LoginPage />,
      },
      {
        path: ROUTE_PATHS.HELP,
        element: <HelpPage />,
      },
      {
        path: ROUTE_PATHS.USER_MANUAL,
        element: <UserManualPage />,
      },
      {
        path: ROUTE_PATHS.HELP,
        element: <HelpPage />,
      },
      {
        path: ROUTE_PATHS.SUMMARY,
        element: <SummaryPage />,
      },
      {
        path: ROUTE_PATHS.REDIRECT_MAGISTRAT_LOLFI,
        element: <LolfiRedirectMagistrat />,
      },
      {
        path: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
        element: <TransparencesLayout />,
        children: [
          {
            index: true,
            element: <SessionsPage />,
          },
          {
            path: ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS,
            element: <ReportListPage />,
          },
          {
            path: ROUTE_PATHS.TRANSPARENCES.DETAILS_REPORTS,
            element: <ReportOverviewPage />,
          },
          {
            path: ROUTE_PATHS.TRANSPARENCES.OBSERVATION_DETAILS,
            element: <ObservationDetailsPage />,
          },
        ],
      },
      {
        path: ROUTE_PATHS.SG.DASHBOARD,
        element: <SecretariatGeneralLayout />,
        children: [
          {
            index: true,
            element: <SecretariatGeneralPage />,
          },
          {
            path: ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE,
            element: <NouvelleTransparencePage />,
          },
          {
            path: ROUTE_PATHS.SG.SESSION_ID,
            element: <TransparencePage />,
          },
          {
            path: ROUTE_PATHS.SG.SESSION_ID_EDIT,
            element: <TableauDeBordEditTransparencePage />,
          },
          {
            path: ROUTE_PATHS.SG.OBSERVATION_DETAILS,
            element: <ObservationDetailsPage />,
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_SESSION,
            element: <ManageSessionPage />,
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_MEMBERS,
            element: <MemberListPage />,
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER,
            element: <DetailsMemberPage />,
          },
          {
            path: ROUTE_PATHS.SG.AGENDA_NEW,
            element: <CreateOrUpdateAgendaPage />,
          },
          {
            path: ROUTE_PATHS.SG.AGENDA_UPDATE,
            element: <CreateOrUpdateAgendaPage />,
          },
          {
            path: ROUTE_PATHS.SG.AGENDA_PREVIEW,
            element: <AgendaPreviewPage />,
          },
          {
            path: ROUTE_PATHS.SG.OFFICIAL_REPORT_NEW,
            element: <CreateOrUpdateOfficialReportPage />,
          },
          {
            path: ROUTE_PATHS.SG.OFFICIAL_REPORT_UPDATE,
            element: <CreateOrUpdateOfficialReportPage />,
          },
          {
            path: ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW,
            element: <OfficialReportPreviewPage />,
          },
          {
            element: <PresentationsLayout />,
            children: [
              {
                element: <PresentationsTabsPage />,
                children: [
                  { path: ROUTE_PATHS.SG.PRESENTATIONS_PAST, element: <PresentationsTabPast /> },
                  { path: ROUTE_PATHS.SG.PRESENTATIONS_READY, element: <PresentationsTabReady /> },
                ],
              },
              { path: ROUTE_PATHS.SG.PRESENTATIONS_NEW, element: <PresentationUpsertPage /> },
              { path: ROUTE_PATHS.SG.PRESENTATIONS_UPDATE, element: <PresentationUpsertPage /> },
              { path: ROUTE_PATHS.SG.PRESENTATIONS_PREVIEW, element: <PresentationPreviewPage /> },
            ],
          },
        ],
      },
      {
        path: ROUTE_PATHS.ADMIN.ROOT,
        element: <AdminLayout />,
        children: [
          {
            path: ROUTE_PATHS.ADMIN.INGEST_LOLFI,
            element: <IngestLolfiArchivePage />,
          },
          {
            path: ROUTE_PATHS.ADMIN.LIST_JOBS,
            element: <JobsPage />,
            children: [{ path: ROUTE_PATHS.ADMIN.DETAILS_JOB, element: <DetailsJobPage /> }],
          },
          {
            path: ROUTE_PATHS.ADMIN.USERS,
            element: <AdminUserListPage />,
          },
          {
            path: ROUTE_PATHS.ADMIN.USER_DETAIL,
            element: <AdminUserDetailPage />,
          },
        ],
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
