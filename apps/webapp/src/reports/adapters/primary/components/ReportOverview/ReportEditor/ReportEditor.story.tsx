import { Provider } from "react-redux";
import { AllRulesMapV2, NominationFile } from "shared-models";
import { FileProvider } from "../../../../../../shared-kernel/core-logic/providers/fileProvider";
import { initReduxStore, ReduxStore } from "../../../../../../store/reduxStore";
import { ReportBuilder } from "../../../../../core-logic/builders/Report.builder";
import { ReportApiModelBuilder } from "../../../../../core-logic/builders/ReportApiModel.builder";
import { reportFileAttached } from "../../../../../core-logic/listeners/report-file-attached.listeners";
import { retrieveReport } from "../../../../../core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import { ApiReportGateway } from "../../../../secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../../secondary/gateways/FakeReport.client";
import { RulesLabelsMap } from "../../../labels/rules-labels";
import ReportOverview from "../ReportOverview";

declare const window: {
  store: ReduxStore;
};

/**
 * Because playwright runs a production build,
 * We need to explicitely provide an empty rules map.
 */
const testRulesMap: AllRulesMapV2 = {
  [NominationFile.RuleGroup.MANAGEMENT]: [],
  [NominationFile.RuleGroup.STATUTORY]: [],
  [NominationFile.RuleGroup.QUALITATIVE]: [],
};

interface ReportEditorForTestProps {
  content: string | null;
}

export function ReportEditorForTest({ content }: ReportEditorForTestProps) {
  const reportApiModel = new ReportApiModelBuilder(testRulesMap)
    .with("comment", content)
    .build();

  const reportApiClient = new FakeReportApiClient();
  reportApiClient.addReports(reportApiModel);
  const reportGateway = new ApiReportGateway(reportApiClient);

  const store = initReduxStore(
    {
      reportGateway,
    },
    {
      fileProvider: new FileProvider(),
    },
    {},
    { reportFileAttached },
    undefined,
    testRulesMap,
    {
      [NominationFile.RuleGroup.MANAGEMENT]: {},
      [NominationFile.RuleGroup.STATUTORY]: {},
      [NominationFile.RuleGroup.QUALITATIVE]: {},
    } as RulesLabelsMap,
    [],
    new Date(),
  );

  const report = ReportBuilder.fromApiModel(reportApiModel).buildRetrieveSM();
  store.dispatch(retrieveReport.fulfilled(report, "", ""));
  window.store = store;

  return (
    <Provider store={store}>
      <ReportOverview id={report.id} />
    </Provider>
  );
}
