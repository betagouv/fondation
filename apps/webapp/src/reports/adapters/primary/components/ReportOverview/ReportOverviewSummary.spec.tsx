import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { AllRulesMap, NominationFile } from "shared-models";
import { initReduxStore, ReduxStore } from "../../../../../store/reduxStore";
import {
  ReportApiModel,
  ReportApiModelBuilder,
} from "../../../../core-logic/builders/ReportApiModel.builder";
import { ApiReportGateway } from "../../../secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../secondary/gateways/FakeReport.client";
import { reportHtmlIds } from "../../dom/html-ids";
import { summaryLabels } from "../../labels/summary-labels";
import { ReportOverview } from "./ReportOverview";

const testRulesMap = {
  [NominationFile.RuleGroup.MANAGEMENT]: [],
  [NominationFile.RuleGroup.STATUTORY]: [],
  [NominationFile.RuleGroup.QUALITATIVE]: [],
} as const satisfies AllRulesMap;

describe("Report Overview Component - Summary use cases", () => {
  let store: ReduxStore;
  let reportApiClient: FakeReportApiClient;
  let reportApiModelBuilder: ReportApiModelBuilder;

  beforeEach(() => {
    reportApiClient = new FakeReportApiClient();
    const reportGateway = new ApiReportGateway(reportApiClient);
    store = initReduxStore(
      {
        reportGateway,
      },
      {},
      {},
      undefined,
      undefined,
      testRulesMap,
    );

    reportApiModelBuilder = new ReportApiModelBuilder(testRulesMap);
  });

  it("doesn't show the summary if no report found", async () => {
    renderReportId("invalid-id");
    expect(screen.findByText("Sommaire")).rejects.toThrow();
  });

  describe("when there is a report", () => {
    it("shows the summary content", async () => {
      const report = reportApiModelBuilder.build();
      givenARenderedReport(report);

      const summaryContainer = await screen.findByRole("navigation");
      const withinSummary = within(summaryContainer);

      for (const heading of summaryHeadings) {
        expect(withinSummary.getByText(heading)).toBeDefined();
      }
    });

    it("always show the summary on the page", async () => {
      const report = reportApiModelBuilder.build();
      givenARenderedReport(report);

      // There is two titles because of the way the DSFR handles responsiveness
      // (one is hidden)
      await screen.findAllByText("SOMMAIRE");
    });

    it.each`
      sectionTitle                       | anchorId
      ${summaryLabels.comment}           | ${htmlIds.commentSection}
      ${summaryLabels.biography}         | ${htmlIds.biographySection}
      ${summaryLabels.observers}         | ${htmlIds.observersSection}
      ${summaryLabels.rules.management}  | ${htmlIds.managementSection}
      ${summaryLabels.rules.statutory}   | ${htmlIds.statutorySection}
      ${summaryLabels.rules.qualitative} | ${htmlIds.qualitativeSection}
      ${summaryLabels.attachedFiles}     | ${htmlIds.attachedFilesSection}
    `(
      "redirects to the expected url on a summary link click",
      async ({ sectionTitle, anchorId }) => {
        const report = reportApiModelBuilder.build();
        givenARenderedReport(report);

        const summaryContainer = await screen.findByRole("navigation");

        const withinSummary = within(summaryContainer);

        const summarySection = withinSummary.getByText(sectionTitle);
        await userEvent.click(summarySection);
        expect(window.location.hash).toEqual(`#${anchorId}`);
      },
    );

    it.each`
      sectionLabelToClick               | sectionLabelUncliked
      ${summaryLabels.comment}          | ${summaryLabels.biography}
      ${summaryLabels.rules.management} | ${summaryLabels.attachedFiles}
    `(
      "highlights the clicked section in the summary",
      async ({ sectionLabelToClick, sectionLabelUncliked }) => {
        const report = reportApiModelBuilder.build();
        givenARenderedReport(report);

        const summaryContainer = await screen.findByRole("navigation");

        const withinSummary = within(summaryContainer);

        const sectionToClick = withinSummary.getByText(sectionLabelToClick);
        await userEvent.click(sectionToClick);

        expect(sectionToClick).toHaveAttribute("aria-current", "page");

        const unclickedSummarySection =
          withinSummary.getByText(sectionLabelUncliked);
        expect(unclickedSummarySection).not.toHaveAttribute(
          "aria-current",
          "page",
        );
      },
    );
  });

  const givenARenderedReport = (report: ReportApiModel) => {
    reportApiClient.reports = {};
    reportApiClient.addReport(report);

    return renderReportId(report.id);
  };

  const renderReportId = (reportId: string) => {
    return render(
      <Provider store={store}>
        <ReportOverview id={reportId} />
      </Provider>,
    );
  };
});

const summaryHeadings = [
  summaryLabels.comment,
  summaryLabels.biography,
  summaryLabels.observers,
  summaryLabels.rules.management,
  summaryLabels.rules.statutory,
  summaryLabels.rules.qualitative,
  summaryLabels.attachedFiles,
];

const htmlIds = reportHtmlIds.overview;
