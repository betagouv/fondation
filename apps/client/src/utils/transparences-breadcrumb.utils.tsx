import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';

import type { BreadcrumbVM } from '@/shared/ui/Breadcrumb';

import { getDetailSessionGdsPath, ROUTE_PATHS } from './route-path.utils';
import { assertNever } from './types.util';

export enum TransparencesCurrentPage {
  perGdsTransparencyReports = 'per-gds-transparency-reports',
  gdsReport = 'gds-report',
}

type TransparencesCurrentPageType =
  | {
      name: typeof TransparencesCurrentPage.perGdsTransparencyReports;
      session: { name: string };
    }
  | {
      name: typeof TransparencesCurrentPage.gdsReport;
      nominationFileName: string;
      session: { id: string; name: string };
    };

export function useMemberBreadcrumbRoot(): BreadcrumbVM['segments'] {
  const { formatMessage } = useIntl();
  return useMemo(
    () => [{ label: formatMessage({ defaultMessage: 'Accueil' }), to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD }],
    [formatMessage],
  );
}

export function useTransparencesBreadCrumb(): (currentPage: TransparencesCurrentPageType) => BreadcrumbVM {
  const memberRoot = useMemberBreadcrumbRoot();

  return useCallback(
    (currentPage: TransparencesCurrentPageType): BreadcrumbVM => {
      switch (currentPage.name) {
        case TransparencesCurrentPage.perGdsTransparencyReports:
          return { currentPageLabel: currentPage.session.name, segments: memberRoot };

        case TransparencesCurrentPage.gdsReport:
          return {
            currentPageLabel: currentPage.nominationFileName,
            segments: [
              ...memberRoot,
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
    [memberRoot],
  );
}
