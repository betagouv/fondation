import { AllRulesMapV2, NominationFile } from "shared-models";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { retrieveReport } from "../../../core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import { reportHtmlIds } from "../dom/html-ids";
import { RulesLabelsMap } from "../labels/rules-labels";
import { SummarySection } from "../labels/summary-labels";
import { selectSummary } from "./selectSummary";

describe("Select Report Summary", () => {
  const currentDate = new DateOnly(2025, 10, 2);

  let store: ReduxStore;
  let reportBuilder: ReportBuilder;

  const emptyTestRulesMap = {
    [NominationFile.RuleGroup.MANAGEMENT]: [],
    [NominationFile.RuleGroup.STATUTORY]: [],
    [NominationFile.RuleGroup.QUALITATIVE]: [],
  } as const satisfies AllRulesMapV2;
  const emptyLabelsRulesMap: RulesLabelsMap<typeof emptyTestRulesMap> = {
    [NominationFile.RuleGroup.MANAGEMENT]: {},
    [NominationFile.RuleGroup.STATUTORY]: {},
    [NominationFile.RuleGroup.QUALITATIVE]: {},
  };

  beforeEach(() => {
    store = initReduxStore(
      {},
      {},
      {},
      undefined,
      undefined,
      emptyTestRulesMap,
      emptyLabelsRulesMap,
      summarySections,
      currentDate.toDate(),
    );
    reportBuilder = new ReportBuilder(emptyTestRulesMap);
  });

  it("doesn't include observer section in summary if there are no observers", () => {
    const aReport = reportBuilder.with("observers", null).buildRetrieveSM();
    givenAReport(aReport);

    expect(selectSummary(store.getState(), aReport.id)).toEqual([
      biographySection,
    ]);
  });

  const givenAReport = (
    report: ReturnType<typeof reportBuilder.buildRetrieveSM>,
  ) => {
    store.dispatch(retrieveReport.fulfilled(report, "", ""));
  };
});

const biographySection = {
  anchorId: reportHtmlIds.overview.biographySection,
  label: "Biographie",
};
const summarySections: SummarySection[] = [
  biographySection,
  { anchorId: reportHtmlIds.overview.observersSection, label: "Observants" },
];
