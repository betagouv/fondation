import { createAppSelector } from "../../../store/createAppSelector";

export enum BreadcrumCurrentPage {
  perGdsTransparencyReports = "per-gds-transparency-reports",
  gdsReport = "gds-report",
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
    const reportsPagelabel = "Rapports";

    switch (currentPage.name) {
      case BreadcrumCurrentPage.perGdsTransparencyReports:
        return {
          currentPageLabel: reportsPagelabel,
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
                  label: reportsPagelabel,
                  ...getTransparencyReportsAnchorAttributes(
                    report.transparency,
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
