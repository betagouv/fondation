import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';

import { useBreadcrumbRoot } from '@/shared/hooks/useBreadcrumbRoot';
import type { BreadcrumbVM } from '@/shared/ui/Breadcrumb';

import { getDetailSessionGdsPath, ROUTE_PATHS, SESSION_SPACES, type SessionSpace } from './route-path.utils';
import { assertNever } from './types.util';

export enum TransparencesCurrentPage {
  perGdsTransparencyReports = 'per-gds-transparency-reports',
  gdsReport = 'gds-report',
}

type BreadcrumbSession = { isArchived: boolean; name: string };

type TransparencesCurrentPageType =
  | {
      name: typeof TransparencesCurrentPage.perGdsTransparencyReports;
      session: BreadcrumbSession;
    }
  | {
      name: typeof TransparencesCurrentPage.gdsReport;
      nominationFileName: string;
      session: BreadcrumbSession & { id: string };
    };

export function useMemberBreadcrumbRoot(): BreadcrumbVM['segments'] {
  const { formatMessage } = useIntl();
  return useMemo(
    () => [{ label: formatMessage({ defaultMessage: 'Accueil' }), to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD }],
    [formatMessage],
  );
}

export function useSessionBreadcrumbRoot(
  space: SessionSpace,
): (session: { isArchived: boolean } | null | undefined) => BreadcrumbVM['segments'] {
  const { formatMessage } = useIntl();
  const sgRoot = useBreadcrumbRoot();
  const memberRoot = useMemberBreadcrumbRoot();
  const root = space === 'SG' ? sgRoot : memberRoot;

  return useCallback(
    (session) =>
      session?.isArchived
        ? [
            ...root,
            {
              label: formatMessage({ defaultMessage: 'Sessions archivées' }),
              to: SESSION_SPACES[space].archivedSessions,
            },
          ]
        : root,
    [formatMessage, root, space],
  );
}

export function useTransparencesBreadCrumb(): (currentPage: TransparencesCurrentPageType) => BreadcrumbVM {
  const sessionRootOf = useSessionBreadcrumbRoot('TRANSPARENCES');

  return useCallback(
    (currentPage: TransparencesCurrentPageType): BreadcrumbVM => {
      switch (currentPage.name) {
        case TransparencesCurrentPage.perGdsTransparencyReports:
          return { currentPageLabel: currentPage.session.name, segments: sessionRootOf(currentPage.session) };

        case TransparencesCurrentPage.gdsReport:
          return {
            currentPageLabel: currentPage.nominationFileName,
            segments: [
              ...sessionRootOf(currentPage.session),
              {
                label: currentPage.session.name,
                to: getDetailSessionGdsPath({ sessionId: currentPage.session.id }),
              },
            ],
          };

        default:
          return assertNever(currentPage);
      }
    },
    [sessionRootOf],
  );
}
