import type { NavigateFunction } from 'react-router-dom';
import { Magistrat } from 'shared-models';
import {
  formationToLabel,
  transparencyToLabel
} from '../components/reports/labels/labels-mappers';
import type { BreadcrumbVM } from '../models/breadcrumb-vm.model';
import { getGdsDetailsPath, ROUTE_PATHS } from './route-path.utils';
import type { ReportSM } from '../queries/list-reports.queries';

export enum TransparencesCurrentPage {
  perGdsTransparencyReports = 'per-gds-transparency-reports',
  gdsReport = 'gds-report'
}

type TransparencesCurrentPageType =
  | {
      name: typeof TransparencesCurrentPage.perGdsTransparencyReports;
      formation: Magistrat.Formation;
    }
  | {
      name: typeof TransparencesCurrentPage.gdsReport;
      report: ReportSM;
    };

export const getTransparencesBreadCrumb = (
  currentPage: TransparencesCurrentPageType,
  navigate: NavigateFunction
): BreadcrumbVM => {
  const TRANSPARENCES_ANCHOR_ATTRIBUTES = {
    href: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      navigate(ROUTE_PATHS.TRANSPARENCES.DASHBOARD);
    }
  };

  const transparenciesSegment = {
    label: 'Transparences',
    ...TRANSPARENCES_ANCHOR_ATTRIBUTES
  };

  const gdsTransparenciesSegment = {
    label: 'Pouvoir de proposition du garde des Sceaux',
    ...TRANSPARENCES_ANCHOR_ATTRIBUTES
  };

  switch (currentPage.name) {
    case TransparencesCurrentPage.perGdsTransparencyReports: {
      return {
        currentPageLabel: `Formation ${formationToLabel(currentPage.formation)}`,
        segments: [transparenciesSegment, gdsTransparenciesSegment]
      };
    }

    case TransparencesCurrentPage.gdsReport: {
      const { report } = currentPage;
      if (!report) {
        return {
          currentPageLabel: 'Rapport non trouvé',
          segments: [transparenciesSegment, gdsTransparenciesSegment]
        };
      }

      const transparencyLabel = transparencyToLabel(
        report.transparency,
        report.dateTransparence
      );

      const path = getGdsDetailsPath(
        report.dateTransparence,
        report.transparency,
        report.formation as Magistrat.Formation
      );
      const transparencySegment = {
        label: transparencyLabel,
        href: path,
        onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          navigate(path);
        }
      };

      return {
        currentPageLabel: report.name,
        segments: [
          transparenciesSegment,
          gdsTransparenciesSegment,
          transparencySegment
        ]
      };
    }

    default: {
      const _exhaustiveCheck: never = currentPage;
      console.info(_exhaustiveCheck);
      throw new Error(`Unhandled page: ${currentPage}`);
    }
  }
};
