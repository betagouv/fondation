import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { AllRulesMap, NominationFile } from "shared-models";
import { initReduxStore, ReduxStore } from "../../../../../store/reduxStore";
import {
  ReportApiModel,
  ReportApiModelBuilder,
} from "../../../../core-logic/builders/ReportApiModel.builder";
import { ReportVM } from "../../../../core-logic/view-models/ReportVM";
import { ApiReportGateway } from "../../../secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../secondary/gateways/FakeReport.client";
import { ReportOverview } from "./ReportOverview";

const testRulesMap = {
  [NominationFile.RuleGroup.MANAGEMENT]: [],
  [NominationFile.RuleGroup.STATUTORY]: [],
  [NominationFile.RuleGroup.QUALITATIVE]: [],
} as const satisfies AllRulesMap;

describe("Report Overview Component - Magistrate identity", () => {
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
      {},
      undefined,
      testRulesMap,
      [],
      new Date(2020, 0, 1),
    );

    reportApiModelBuilder = new ReportApiModelBuilder(testRulesMap);
  });

  it("shows magistrate identity section", async () => {
    const reportApiModel = reportApiModelBuilder
      .with("birthDate", {
        year: 1980,
        month: 1,
        day: 1,
      })
      .build();
    givenARenderedReport(reportApiModel);
    await expectMagistratIdentity();
  });

  const expectMagistratIdentity = async () => {
    const labels = ReportVM.magistratIdentityLabels;
    await screen.findByText("John Doe");
    await screen.findByText(`${labels.currentPosition} : PG TJ Paris`);
    await screen.findByText(`${labels.grade} : I`);
    await screen.findByText(`${labels.targettedPosition} : PG TJ Marseille`);
    await screen.findByText(`${labels.rank} : (2 sur une liste de 3)`);
    await screen.findByText(`${labels.birthDate} : 01/01/1980 (40 ans)`);
  };

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
