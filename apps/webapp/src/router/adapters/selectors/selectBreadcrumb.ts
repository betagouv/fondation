import { Magistrat } from "shared-models";
import {
  formationToLabel,
  transparencyToLabel,
} from "../../../reports/adapters/primary/labels/labels-mappers";
import { createAppSelector } from "../../../store/createAppSelector";

export enum BreadcrumCurrentPage {
  perGdsTransparencyReports = "per-gds-transparency-reports",
  gdsReport = "gds-report",
  secretariatGeneral = "secretariat-general",
  sgNouvelleTransparence = "sg-nouvelle-transparence",
}

export type BreadcrumbVM = {
  currentPageLabel: string;
  segments: {
    label: string;
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  }[];
};

type CurrentPage =
  | {
      name: BreadcrumCurrentPage.perGdsTransparencyReports;
      formation: Magistrat.Formation;
    }
  | {
      name: BreadcrumCurrentPage.gdsReport;
      reportId: string;
    }
  | {
      name: BreadcrumCurrentPage.secretariatGeneral;
    }
  | {
      name: BreadcrumCurrentPage.sgNouvelleTransparence;
    };

export const selectBreadcrumb = createAppSelector(
  [
    (state) => state.router.anchorsAttributes.transparencies,
    (state) => state.router.anchorsAttributes.perTransparency,
    (state) => state.reportOverview.byIds,
    (state) => state.router.anchorsAttributes.secretariatGeneral.dashboard,
    (_, currentPage: CurrentPage) => currentPage,
  ],
  (
    getTransparenciesAnchorAttributes,
    getTransparencyReportsAnchorAttributes,
    reports,
    getSecretariatGeneralAnchorAttributes,
    currentPage,
  ): BreadcrumbVM => {
    const transparenciesSegment = {
      label: "Transparences",
      ...getTransparenciesAnchorAttributes(),
    };
    const gdsTransparenciesSegment = {
      label: "Pouvoir de proposition du garde des Sceaux",
      ...getTransparenciesAnchorAttributes(),
    };

    switch (currentPage.name) {
      case BreadcrumCurrentPage.perGdsTransparencyReports:
        return {
          currentPageLabel: `Formation ${formationToLabel(currentPage.formation)}`,
          segments: [transparenciesSegment, gdsTransparenciesSegment],
        };

      case BreadcrumCurrentPage.gdsReport: {
        const report = reports?.[currentPage.reportId];

        return report
          ? {
              currentPageLabel: report.name,
              segments: [
                transparenciesSegment,
                gdsTransparenciesSegment,
                {
                  label: transparencyToLabel(report.transparency),
                  ...getTransparencyReportsAnchorAttributes(
                    report.transparency,
                    report.formation,
                  ),
                },
              ],
            }
          : {
              currentPageLabel: "Rapport non trouvé",
              segments: [transparenciesSegment, gdsTransparenciesSegment],
            };
      }

      case BreadcrumCurrentPage.sgNouvelleTransparence: {
        const secretariatGeneralSegments = [
          {
            label: "Secretariat général",
            ...getSecretariatGeneralAnchorAttributes(),
          },
          {
            label: "Tableau de bord",
            ...getSecretariatGeneralAnchorAttributes(),
          },
        ];
        return {
          currentPageLabel: "Créer une nouvelle transparence",
          segments: secretariatGeneralSegments,
        };
      }

      case BreadcrumCurrentPage.secretariatGeneral: {
        const secretariatGeneralSegments = [
          {
            label: "Secretariat général",
            ...getSecretariatGeneralAnchorAttributes(),
          },
        ];
        return {
          currentPageLabel: "Tableau de bord",
          segments: secretariatGeneralSegments,
        };
      }

      default: {
        const _exhaustiveCheck: never = currentPage;
        console.info(_exhaustiveCheck);
        throw new Error(`Unhandled page: ${currentPage}`);
      }
    }
  },
);
