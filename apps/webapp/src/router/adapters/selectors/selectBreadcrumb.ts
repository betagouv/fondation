import { Magistrat } from "shared-models";
import {
  formationToLabel,
  transparencyToLabel,
} from "../../../reports/adapters/primary/labels/labels-mappers";
import { BreadcrumbVM } from "../../../shared-kernel/core-logic/models/breadcrumb-vm";
import { createAppSelector } from "../../../store/createAppSelector";

export enum BreadcrumCurrentPage {
  perGdsTransparencyReports = "per-gds-transparency-reports",
  gdsReport = "gds-report",
}

type CurrentPage =
  | {
      name: BreadcrumCurrentPage.perGdsTransparencyReports;
      formation: Magistrat.Formation;
    }
  | {
      name: BreadcrumCurrentPage.gdsReport;
      reportId: string;
    };

export const selectBreadcrumb = createAppSelector(
  [
    (state) => state.router.anchorsAttributes.transparencies,
    (state) => state.router.anchorsAttributes.perTransparency,
    (state) => state.reportOverview.byIds,
    (_, currentPage: CurrentPage) => currentPage,
  ],
  (
    getTransparenciesAnchorAttributes,
    getTransparencyReportsAnchorAttributes,
    reports,
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

      default: {
        const _exhaustiveCheck: never = currentPage;
        console.info(_exhaustiveCheck);
        throw new Error(`Unhandled page: ${currentPage}`);
      }
    }
  },
);
