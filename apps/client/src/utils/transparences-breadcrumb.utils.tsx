import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router';

import { transparencyToLabel } from '@/features/transparence/labels/labels-mappers';
import { type FormationEnum, FormationEnumMessages } from '@/shared/enums/formation.enum';
import type { BreadcrumbVM } from '@/shared/ui/Breadcrumb';

import type { PlainDateOnly } from './date-only.util';
import { getDetailSessionGdsPath, ROUTE_PATHS } from './route-path.utils';
import { assertNever } from './types.util';

export enum TransparencesCurrentPage {
  perGdsTransparencyReports = 'per-gds-transparency-reports',
  gdsReport = 'gds-report',
}

type TransparencesCurrentPageType =
  | {
      name: typeof TransparencesCurrentPage.perGdsTransparencyReports;
      formation: FormationEnum;
    }
  | {
      name: typeof TransparencesCurrentPage.gdsReport;
      nominationFileName: string;
      session: { date: PlainDateOnly; id: string; name: string };
    };

export function useTransparencesBreadCrumb(): (currentPage: TransparencesCurrentPageType) => BreadcrumbVM {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();

  return useCallback(
    (currentPage: TransparencesCurrentPageType): BreadcrumbVM => {
      const TRANSPARENCES_ANCHOR_ATTRIBUTES = {
        to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
        onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          navigate(ROUTE_PATHS.TRANSPARENCES.DASHBOARD);
        },
      };

      const transparenciesSegment = {
        label: formatMessage({ defaultMessage: 'Transparences' }),
        ...TRANSPARENCES_ANCHOR_ATTRIBUTES,
      };

      const gdsTransparenciesSegment = {
        label: formatMessage({ defaultMessage: 'Pouvoir de proposition du garde des Sceaux' }),
        ...TRANSPARENCES_ANCHOR_ATTRIBUTES,
      };

      switch (currentPage.name) {
        case TransparencesCurrentPage.perGdsTransparencyReports: {
          return {
            currentPageLabel: formatMessage(
              { defaultMessage: 'Formation {formation}' },
              { formation: formatMessage(FormationEnumMessages[currentPage.formation]) },
            ),
            segments: [transparenciesSegment, gdsTransparenciesSegment],
          };
        }

        case TransparencesCurrentPage.gdsReport: {
          const { session } = currentPage;
          const transparencyLabel = transparencyToLabel(session.name, session.date);

          const path = getDetailSessionGdsPath({ sessionId: session.id });
          const transparencySegment = {
            label: transparencyLabel,
            to: path,
            onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
              event.preventDefault();
              navigate(path);
            },
          };

          return {
            currentPageLabel: currentPage.nominationFileName,
            segments: [transparenciesSegment, gdsTransparenciesSegment, transparencySegment],
          };
        }

        default:
          return assertNever(currentPage);
      }
    },
    [formatMessage, navigate],
  );
}
