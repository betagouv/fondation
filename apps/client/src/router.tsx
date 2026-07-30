import * as Sentry from '@sentry/react';
import { createBrowserRouter } from 'react-router';

import { AUTHORIZED_ROLES } from '@/features/auth/constants/authorized-roles.constants';
import { roleGuard } from '@/features/auth/guards/role-guard';
import { RootLayout } from '@/layout/RootLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ErrorPage } from '@/pages/error/ErrorPage';
import { redirectToMemberMagistratDetails, ROUTE_PATHS } from '@/utils/route-path.utils';

const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouterV7(createBrowserRouter);
export const router = sentryCreateBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: null,
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
        loader: roleGuard(AUTHORIZED_ROLES.ALL),
        children: [
          {
            path: ROUTE_PATHS.HELP,
            lazy: () => import('@/pages/help/HelpPage').then(({ HelpPage }) => ({ Component: HelpPage })),
          },
          {
            path: ROUTE_PATHS.USER_MANUAL,
            lazy: () =>
              import('@/pages/help/UserManualPage').then(({ UserManualPage }) => ({
                Component: UserManualPage,
              })),
          },
          {
            path: ROUTE_PATHS.SUMMARY,
            lazy: () =>
              import('@/pages/summary/SummaryPage').then(({ SummaryPage }) => ({ Component: SummaryPage })),
          },
          {
            path: ROUTE_PATHS.REDIRECT_MAGISTRAT_LOLFI,
            lazy: () =>
              import('@/pages/sessions/LolfiRedirectMagistratPage').then(({ LolfiRedirectMagistrat }) => ({
                Component: LolfiRedirectMagistrat,
              })),
          },
        ],
      },
      {
        loader: roleGuard(AUTHORIZED_ROLES.MEMBER),
        children: [
          {
            lazy: () =>
              import('@/pages/spaces/member/MemberContentLayout').then(({ MemberContentLayout }) => ({
                Component: MemberContentLayout,
              })),
            children: [
              {
                path: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
                lazy: () =>
                  import('@/pages/transparence/SessionsPage').then(({ SessionsPage }) => ({
                    Component: SessionsPage,
                  })),
              },
              {
                path: ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS,
                lazy: () =>
                  import('@/pages/reports/ReportListPage').then(({ default: ReportListPage }) => ({
                    Component: ReportListPage,
                  })),
              },
            ],
          },
          {
            lazy: () =>
              import('@/pages/spaces/member/MemberReportOverviewLayout').then(
                ({ MemberReportOverviewLayout }) => ({ Component: MemberReportOverviewLayout }),
              ),
            children: [
              {
                path: ROUTE_PATHS.TRANSPARENCES.DETAILS_REPORTS,
                lazy: () =>
                  import('@/pages/reports/ReportOverviewPage').then(({ default: ReportOverviewPage }) => ({
                    Component: ReportOverviewPage,
                  })),
              },
            ],
          },
          {
            path: ROUTE_PATHS.TRANSPARENCES.OBSERVATION_DETAILS,
            lazy: () =>
              import('@/pages/observations/ObservationDetailsPage').then(({ ObservationDetailsPage }) => ({
                Component: ObservationDetailsPage,
              })),
          },
          {
            path: ROUTE_PATHS.MEMBER.MAGISTRAT_DETAILS,
            lazy: () =>
              import('@/pages/magistrats/MagistratDetailsPage').then(({ MagistratDetailsPage }) => ({
                Component: MagistratDetailsPage,
              })),
          },
          {
            path: ROUTE_PATHS.TRANSPARENCES.MAGISTRAT_DETAILS,
            loader: redirectToMemberMagistratDetails,
          },
        ],
      },
      {
        path: ROUTE_PATHS.SG.DASHBOARD,
        loader: roleGuard(AUTHORIZED_ROLES.SG),
        children: [
          {
            index: true,
            lazy: () =>
              import('@/pages/spaces/secretariat-general/SecretariatGeneralPage').then(
                ({ SecretariatGeneralPage }) => ({ Component: SecretariatGeneralPage }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE,
            lazy: () =>
              import('@/pages/transparence/NouvelleTransparencePage').then(
                ({ NouvelleTransparencePage }) => ({ Component: NouvelleTransparencePage }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.SESSION_ID,
            lazy: () =>
              import('@/pages/transparence/TransparencePage').then(({ TransparencePage }) => ({
                Component: TransparencePage,
              })),
          },
          {
            path: ROUTE_PATHS.SG.SESSION_ID_EDIT,
            lazy: () =>
              import('@/features/transparence/components/TableauDeBordEditTransparence').then(
                ({ TableauDeBordEditTransparencePage }) => ({
                  Component: TableauDeBordEditTransparencePage,
                }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.OBSERVATION_DETAILS,
            lazy: () =>
              import('@/pages/observations/ObservationDetailsPage').then(({ ObservationDetailsPage }) => ({
                Component: ObservationDetailsPage,
              })),
          },
          {
            path: ROUTE_PATHS.SG.MAGISTRAT_DETAILS,
            lazy: () =>
              import('@/pages/magistrats/MagistratDetailsPage').then(({ MagistratDetailsPage }) => ({
                Component: MagistratDetailsPage,
              })),
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_SESSION,
            lazy: () =>
              import('@/pages/sessions/ManageSessionPage').then(({ ManageSessionPage }) => ({
                Component: ManageSessionPage,
              })),
          },
          {
            path: ROUTE_PATHS.SG.ARCHIVED_SESSIONS,
            lazy: () =>
              import('@/pages/sessions/ArchivedSessionsPage').then(({ ArchivedSessionsPage }) => ({
                Component: ArchivedSessionsPage,
              })),
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_MEMBERS,
            lazy: () =>
              import('@/pages/members/MemberListPage').then(({ MemberListPage }) => ({
                Component: MemberListPage,
              })),
          },
          {
            path: ROUTE_PATHS.SG.MANAGE_SINGLE_MEMBER,
            lazy: () =>
              import('@/pages/members/DetailsMemberPage').then(({ DetailsMemberPage }) => ({
                Component: DetailsMemberPage,
              })),
          },
          {
            path: ROUTE_PATHS.SG.AGENDA_NEW,
            lazy: () =>
              import('@/pages/documents/agenda/AgendaPage').then(({ CreateOrUpdateAgendaPage }) => ({
                Component: CreateOrUpdateAgendaPage,
              })),
          },
          {
            path: ROUTE_PATHS.SG.AGENDA_UPDATE,
            lazy: () =>
              import('@/pages/documents/agenda/AgendaPage').then(({ CreateOrUpdateAgendaPage }) => ({
                Component: CreateOrUpdateAgendaPage,
              })),
          },
          {
            path: ROUTE_PATHS.SG.AGENDA_PREVIEW,
            lazy: () =>
              import('@/pages/documents/agenda/AgendaPreviewPage').then(({ AgendaPreviewPage }) => ({
                Component: AgendaPreviewPage,
              })),
          },
          {
            path: ROUTE_PATHS.SG.OFFICIAL_REPORT_NEW,
            lazy: () =>
              import('@/pages/documents/official-report/OfficialReportPage').then(
                ({ CreateOrUpdateOfficialReportPage }) => ({ Component: CreateOrUpdateOfficialReportPage }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.OFFICIAL_REPORT_UPDATE,
            lazy: () =>
              import('@/pages/documents/official-report/OfficialReportPage').then(
                ({ CreateOrUpdateOfficialReportPage }) => ({ Component: CreateOrUpdateOfficialReportPage }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW,
            lazy: () =>
              import('@/pages/documents/official-report/OfficialReportPreviewPage').then(
                ({ OfficialReportPreviewPage }) => ({ Component: OfficialReportPreviewPage }),
              ),
          },
          {
            path: ROUTE_PATHS.SG.OFFICIAL_REPORT_RENDER,
            lazy: () =>
              import('@/pages/documents/official-report/OfficialReportRenderPage').then(
                ({ OfficialReportRenderPage }) => ({ Component: OfficialReportRenderPage }),
              ),
          },
          {
            lazy: () =>
              import('@/pages/documents/presentations/PresentationsLayout').then(
                ({ PresentationsLayout }) => ({
                  Component: PresentationsLayout,
                }),
              ),
            children: [
              {
                lazy: () =>
                  import('@/pages/documents/presentations/PresentationsTabsPage').then(
                    ({ PresentationsTabsPage }) => ({
                      Component: PresentationsTabsPage,
                    }),
                  ),
                children: [
                  {
                    path: ROUTE_PATHS.SG.PRESENTATIONS_PAST,
                    lazy: () =>
                      import('@/pages/documents/presentations/PresentationsTabPast').then(
                        ({ PresentationsTabPast }) => ({ Component: PresentationsTabPast }),
                      ),
                  },
                  {
                    path: ROUTE_PATHS.SG.PRESENTATIONS_READY,
                    lazy: () =>
                      import('@/pages/documents/presentations/PresentationsTabReady').then(
                        ({ PresentationsTabReady }) => ({ Component: PresentationsTabReady }),
                      ),
                  },
                ],
              },
              {
                path: ROUTE_PATHS.SG.PRESENTATIONS_NEW,
                lazy: () =>
                  import('@/pages/documents/presentations/PresentationUpsertPage').then(
                    ({ PresentationUpsertPage }) => ({ Component: PresentationUpsertPage }),
                  ),
              },
              {
                path: ROUTE_PATHS.SG.PRESENTATIONS_UPDATE,
                lazy: () =>
                  import('@/pages/documents/presentations/PresentationUpsertPage').then(
                    ({ PresentationUpsertPage }) => ({ Component: PresentationUpsertPage }),
                  ),
              },
              {
                path: ROUTE_PATHS.SG.PRESENTATIONS_PREVIEW,
                lazy: () =>
                  import('@/pages/documents/presentations/PresentationsPreviewPage').then(
                    ({ PresentationPreviewPage }) => ({ Component: PresentationPreviewPage }),
                  ),
              },
            ],
          },
        ],
      },
      {
        path: ROUTE_PATHS.ADMIN.ROOT,
        loader: roleGuard(AUTHORIZED_ROLES.NONE),
        children: [
          {
            path: ROUTE_PATHS.ADMIN.INGEST_LOLFI,
            lazy: () =>
              import('@/pages/spaces/admin/IngestLolfiArchivePage').then(({ IngestLolfiArchivePage }) => ({
                Component: IngestLolfiArchivePage,
              })),
          },
          {
            path: ROUTE_PATHS.ADMIN.LIST_JOBS,
            lazy: () =>
              import('@/pages/spaces/admin/AdminJobsPage').then(({ AdminJobsPage }) => ({
                Component: AdminJobsPage,
              })),
            children: [
              {
                path: ROUTE_PATHS.ADMIN.DETAILS_JOB,
                lazy: () =>
                  import('@/pages/spaces/admin/AdminJobDetailsPage').then(({ AdminJobDetailsPage }) => ({
                    Component: AdminJobDetailsPage,
                  })),
              },
            ],
          },
          {
            path: ROUTE_PATHS.ADMIN.USERS,
            lazy: () =>
              import('@/pages/spaces/admin/AdminUserListPage').then(({ AdminUserListPage }) => ({
                Component: AdminUserListPage,
              })),
          },
          {
            path: ROUTE_PATHS.ADMIN.USER_DETAIL,
            lazy: () =>
              import('@/pages/spaces/admin/AdminUserDetailPage').then(({ AdminUserDetailPage }) => ({
                Component: AdminUserDetailPage,
              })),
          },
        ],
      },
    ],
  },
]);
