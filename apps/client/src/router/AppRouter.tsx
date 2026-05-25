import * as Sentry from '@sentry/react';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { HomePage } from '../HomePage';
import { ROUTE_PATHS } from '../utils/route-path.utils';
import { LoginPage } from '@/pages/LoginPage';

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
        lazy: () => import('@/pages/help/HelpPage').then(({ HelpPage }) => ({ Component: HelpPage })),
      },
      {
        path: ROUTE_PATHS.USER_MANUAL,
        lazy: () =>
          import('@/pages/help/UserManualPage').then(({ UserManualPage }) => ({ Component: UserManualPage })),
      },
      {
        path: ROUTE_PATHS.HELP,
        lazy: () => import('@/pages/help/HelpPage').then(({ HelpPage }) => ({ Component: HelpPage })),
      },
      {
        path: ROUTE_PATHS.SUMMARY,
        lazy: () =>
          import('@/pages/summary/SummaryPage').then(({ SummaryPage }) => ({ Component: SummaryPage })),
      },
      {
        path: ROUTE_PATHS.REDIRECT_MAGISTRAT_LOLFI,
        lazy: () =>
          import('@/pages/LolfiRedirectMagistratPage').then(({ LolfiRedirectMagistrat }) => ({
            Component: LolfiRedirectMagistrat,
          })),
      },
      {
        path: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
        lazy: () =>
          import('@/pages/transparence/TransparencesLayout').then(({ TransparencesLayout }) => ({
            Component: TransparencesLayout,
          })),
        children: [
          {
            index: true,
            lazy: () =>
              import('@/pages/transparence/SessionsPage').then(({ SessionsPage }) => ({
                Component: SessionsPage,
              })),
          },
          {
            path: ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS,
            lazy: () =>
              import('@/components/reports/components/ReportList/ReportListPage').then(
                ({ default: ReportListPage }) => ({ Component: ReportListPage }),
              ),
          },
          {
            path: ROUTE_PATHS.TRANSPARENCES.DETAILS_REPORTS,
            lazy: () =>
              import('@/components/reports/components/ReportOverview/ReportOverviewPage').then(
                ({ default: ReportOverviewPage }) => ({ Component: ReportOverviewPage }),
              ),
          },
          {
            path: ROUTE_PATHS.TRANSPARENCES.OBSERVATION_DETAILS,
            lazy: () =>
              import('@/pages/secretariat-general/observations/ObservationDetailsPage').then(
                ({ ObservationDetailsPage }) => ({ Component: ObservationDetailsPage }),
              ),
          },
        ],
      },
      {
        path: ROUTE_PATHS.SG.DASHBOARD,
        lazy: () =>
          import('@/pages/secretariat-general/SecretariatLayout').then(({ SecretariatGeneralLayout }) => ({
            Component: SecretariatGeneralLayout,
          })),
        children: [
          {
            index: true,
            lazy: () =>
              import('@/pages/secretariat-general/SecretariatGeneralPage').then(
                ({ SecretariatGeneralPage }) => ({ Component: SecretariatGeneralPage }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE,
            lazy: () =>
              import('@/pages/secretariat-general/NouvelleTransparencePage').then(
                ({ NouvelleTransparencePage }) => ({ Component: NouvelleTransparencePage }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.SESSION_ID,
            lazy: () =>
              import('@/pages/secretariat-general/TransparencePage').then(({ TransparencePage }) => ({
                Component: TransparencePage,
              })),
          },
          {
            path: ROUTE_PATHS.SG.SESSION_ID_EDIT,
            lazy: () =>
              import('@/components/secretariat-general/transparence/content/tableau-de-bord/resume/TableauDeBordEditTransparence').then(
                ({ TableauDeBordEditTransparencePage }) => ({
                  Component: TableauDeBordEditTransparencePage,
                }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.OBSERVATION_DETAILS,
            lazy: () =>
              import('@/pages/secretariat-general/observations/ObservationDetailsPage').then(
                ({ ObservationDetailsPage }) => ({ Component: ObservationDetailsPage }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_SESSION,
            lazy: () =>
              import('@/pages/secretariat-general/ManageSessionPage').then(({ ManageSessionPage }) => ({
                Component: ManageSessionPage,
              })),
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_MEMBERS,
            lazy: () =>
              import('@/pages/secretariat-general/MemberListPage').then(({ MemberListPage }) => ({
                Component: MemberListPage,
              })),
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER,
            lazy: () =>
              import('@/pages/secretariat-general/membres/DetailsMemberPage').then(
                ({ DetailsMemberPage }) => ({ Component: DetailsMemberPage }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.AGENDA_NEW,
            lazy: () =>
              import('@/pages/secretariat-general/docs/agenda/AgendaPage').then(
                ({ CreateOrUpdateAgendaPage }) => ({ Component: CreateOrUpdateAgendaPage }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.AGENDA_UPDATE,
            lazy: () =>
              import('@/pages/secretariat-general/docs/agenda/AgendaPage').then(
                ({ CreateOrUpdateAgendaPage }) => ({ Component: CreateOrUpdateAgendaPage }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.AGENDA_PREVIEW,
            lazy: () =>
              import('@/pages/secretariat-general/docs/agenda/AgendaPreviewPage').then(
                ({ AgendaPreviewPage }) => ({ Component: AgendaPreviewPage }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.OFFICIAL_REPORT_NEW,
            lazy: () =>
              import('@/pages/secretariat-general/docs/official-report/OfficialReportPage').then(
                ({ CreateOrUpdateOfficialReportPage }) => ({ Component: CreateOrUpdateOfficialReportPage }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.OFFICIAL_REPORT_UPDATE,
            lazy: () =>
              import('@/pages/secretariat-general/docs/official-report/OfficialReportPage').then(
                ({ CreateOrUpdateOfficialReportPage }) => ({ Component: CreateOrUpdateOfficialReportPage }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW,
            lazy: () =>
              import('@/pages/secretariat-general/docs/official-report/OfficialReportPreviewPage').then(
                ({ OfficialReportPreviewPage }) => ({ Component: OfficialReportPreviewPage }),
              ),
          },
          {
            lazy: () =>
              import('@/pages/secretariat-general/presentations/PresentationsLayout').then(
                ({ PresentationsLayout }) => ({ Component: PresentationsLayout }),
              ),
            children: [
              {
                lazy: () =>
                  import('@/pages/secretariat-general/presentations/PresentationsTabsPage').then(
                    ({ PresentationsTabsPage }) => ({ Component: PresentationsTabsPage }),
                  ),
                children: [
                  {
                    path: ROUTE_PATHS.SG.PRESENTATIONS_PAST,
                    lazy: () =>
                      import('@/pages/secretariat-general/presentations/PresentationsTabPast').then(
                        ({ PresentationsTabPast }) => ({ Component: PresentationsTabPast }),
                      ),
                  },
                  {
                    path: ROUTE_PATHS.SG.PRESENTATIONS_READY,
                    lazy: () =>
                      import('@/pages/secretariat-general/presentations/PresentationsTabReady').then(
                        ({ PresentationsTabReady }) => ({ Component: PresentationsTabReady }),
                      ),
                  },
                ],
              },
              {
                path: ROUTE_PATHS.SG.PRESENTATIONS_NEW,
                lazy: () =>
                  import('@/pages/secretariat-general/presentations/PresentationUpsertPage').then(
                    ({ PresentationUpsertPage }) => ({ Component: PresentationUpsertPage }),
                  ),
              },
              {
                path: ROUTE_PATHS.SG.PRESENTATIONS_UPDATE,
                lazy: () =>
                  import('@/pages/secretariat-general/presentations/PresentationUpsertPage').then(
                    ({ PresentationUpsertPage }) => ({ Component: PresentationUpsertPage }),
                  ),
              },
              {
                path: ROUTE_PATHS.SG.PRESENTATIONS_PREVIEW,
                lazy: () =>
                  import('@/pages/secretariat-general/presentations/PresentationsPreviewPage').then(
                    ({ PresentationPreviewPage }) => ({ Component: PresentationPreviewPage }),
                  ),
              },
            ],
          },
        ],
      },
      {
        path: ROUTE_PATHS.ADMIN.ROOT,
        lazy: () =>
          import('@/pages/admin/AdminLayout').then(({ AdminLayout }) => ({ Component: AdminLayout })),
        children: [
          {
            path: ROUTE_PATHS.ADMIN.INGEST_LOLFI,
            lazy: () =>
              import('@/pages/admin/ingest/IngestLolfiArchivePage').then(({ IngestLolfiArchivePage }) => ({
                Component: IngestLolfiArchivePage,
              })),
          },
          {
            path: ROUTE_PATHS.ADMIN.LIST_JOBS,
            lazy: () =>
              import('@/pages/admin/jobs/JobsPage').then(({ JobsPage }) => ({ Component: JobsPage })),
            children: [
              {
                path: ROUTE_PATHS.ADMIN.DETAILS_JOB,
                lazy: () =>
                  import('@/pages/admin/jobs/DetailsJobPage').then(({ DetailsJobPage }) => ({
                    Component: DetailsJobPage,
                  })),
              },
            ],
          },
          {
            path: ROUTE_PATHS.ADMIN.USERS,
            lazy: () =>
              import('@/pages/admin/users/AdminUserListPage').then(({ AdminUserListPage }) => ({
                Component: AdminUserListPage,
              })),
          },
          {
            path: ROUTE_PATHS.ADMIN.USER_DETAIL,
            lazy: () =>
              import('@/pages/admin/users/AdminUserDetailPage').then(({ AdminUserDetailPage }) => ({
                Component: AdminUserDetailPage,
              })),
          },
        ],
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
