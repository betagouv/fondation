import { Magistrat } from "shared-models";
import { transparencyToLabel } from "../../../reports/adapters/primary/labels/labels-mappers";
import { ReportBuilder } from "../../../reports/core-logic/builders/Report.builder";
import { retrieveReport } from "../../../reports/core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { StubRouterProvider } from "../stubRouterProvider";
import {
  BreadcrumbVM,
  BreadcrumCurrentPage,
  selectBreadcrumb,
} from "./selectBreadcrumb";

describe("Breadcrumb", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;
  let breadcrumb: ReturnType<typeof selectBreadcrumb>;

  beforeEach(() => {
    routerProvider = new StubRouterProvider();
    store = initReduxStore(
      {},
      {
        routerProvider,
      },
      {},
    );
  });

  describe("per transparency reports list", () => {
    beforeEach(() => {
      routerProvider.onGoToTransparenciesClick = vi.fn();
    });

    it("shows a breadcrumb", async () => {
      selectPerTransparencyBreadcrumb(Magistrat.Formation.SIEGE);
      expectBreadcrumb({
        currentPageLabel: "Formation Siège",
        segments: [
          {
            label: "Transparences",
            href: "/transparences",
            onClick: expect.any(Function),
          },
          {
            label: "Pouvoir de proposition du garde des Sceaux",
            href: "/transparences",
            onClick: expect.any(Function),
          },
        ],
      });
    });

    it.each`
      segmentIndex | segmentName
      ${0}         | ${"Transparences"}
      ${1}         | ${"Pouvoir de proposition du garde des Sceaux"}
    `(
      "redirects to the transparency page when clicking on segment: $segmentName",
      async ({ segmentIndex }) => {
        selectPerTransparencyBreadcrumb(Magistrat.Formation.SIEGE);
        clickOnSegment(segmentIndex);
        expect(routerProvider.onGoToTransparenciesClick).toHaveBeenCalled();
      },
    );

    const selectPerTransparencyBreadcrumb = (
      formation: Magistrat.Formation,
    ) => {
      breadcrumb = selectBreadcrumb(store.getState(), {
        name: BreadcrumCurrentPage.perGdsTransparencyReports,
        formation,
      });
    };
  });

  describe("GDS report page", () => {
    const baseGdsReportSegments = [
      {
        label: "Transparences",
        href: "/transparences",
        onClick: expect.any(Function),
      },
      {
        label: "Pouvoir de proposition du garde des Sceaux",
        href: "/transparences",
        onClick: expect.any(Function),
      },
    ];

    it("shows a breadcrumb on an invalid report page", async () => {
      selectGdsReportBreadcrumb("invalid-report-id");
      expectBreadcrumb({
        currentPageLabel: "Rapport non trouvé",
        segments: baseGdsReportSegments,
      });
    });

    it("shows a breadcrumb on an a valid report page", async () => {
      store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
      selectGdsReportBreadcrumb(aReport.id);
      expectBreadcrumb({
        currentPageLabel: aReport.name,
        segments: [
          ...baseGdsReportSegments,
          {
            label: transparencyToLabel(aReport.transparency),
            href: routerProvider.getTransparencyReportsHref(
              aReport.transparency,
            ),
            onClick: expect.any(Function),
          },
        ],
      });
    });

    const selectGdsReportBreadcrumb = (reportId: string) => {
      breadcrumb = selectBreadcrumb(store.getState(), {
        name: BreadcrumCurrentPage.gdsReport,
        reportId,
      });
    };
  });

  const clickOnSegment = (segmentIndex: number) =>
    breadcrumb.segments[segmentIndex]!.onClick({
      preventDefault: () => {},
    } as React.MouseEvent<HTMLAnchorElement>);

  const expectBreadcrumb = (expectedBreadcrumb: BreadcrumbVM) =>
    expect(breadcrumb).toEqual(expectedBreadcrumb);
});

const aReport = new ReportBuilder().buildRetrieveSM();

// TODO ADD TESTS FOR SECRETARIAT GENERAL
