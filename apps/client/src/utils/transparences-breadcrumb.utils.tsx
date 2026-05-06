import type { NavigateFunction } from 'react-router';

import { formationToLabel, transparencyToLabel } from '../components/reports/labels/labels-mappers';
import type { BreadcrumbVM } from '../models/breadcrumb-vm.model';
import type { FormationEnum } from '@/types/enums.types';
import type { DetailedReportDto } from '@api/types';

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
      report: DetailedReportDto;
    };

export const getTransparencesBreadCrumb = (
  currentPage: TransparencesCurrentPageType,
  navigate: NavigateFunction,
): BreadcrumbVM => {
  const TRANSPARENCES_ANCHOR_ATTRIBUTES = {
    to: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      navigate(ROUTE_PATHS.TRANSPARENCES.DASHBOARD);
    },
  };

  const transparenciesSegment = {
    label: 'Transparences',
    ...TRANSPARENCES_ANCHOR_ATTRIBUTES,
  };

  const gdsTransparenciesSegment = {
    label: 'Pouvoir de proposition du garde des Sceaux',
    ...TRANSPARENCES_ANCHOR_ATTRIBUTES,
  };

  switch (currentPage.name) {
    case TransparencesCurrentPage.perGdsTransparencyReports: {
      return {
        currentPageLabel: `Formation ${formationToLabel(currentPage.formation)}`,
        segments: [transparenciesSegment, gdsTransparenciesSegment],
      };
    }

    case TransparencesCurrentPage.gdsReport: {
      const { report } = currentPage;
      if (!report) {
        return {
          currentPageLabel: 'Rapport non trouvé',
          segments: [transparenciesSegment, gdsTransparenciesSegment],
        };
      }

      const transparencyLabel = transparencyToLabel(report.transparency, report.dateTransparence);

      const path = getDetailSessionGdsPath({ sessionId: report.sessionId });
      const transparencySegment = {
        label: transparencyLabel,
        to: path,
        onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          navigate(path);
        },
      };

      return {
        currentPageLabel: report.name,
        segments: [transparenciesSegment, gdsTransparenciesSegment, transparencySegment],
      };
    }

    default:
      return assertNever(currentPage);
  }
};
