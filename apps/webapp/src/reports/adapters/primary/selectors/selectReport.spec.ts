import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { ReportBuilderVM } from "../../../core-logic/builders/ReportVM.builder";
import { retrieveReport } from "../../../core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import {
  updateReportRule,
  UpdateReportRuleParams,
} from "../../../core-logic/use-cases/report-rule-update/updateReportRule.use-case";
import { ReportVM } from "../../../core-logic/view-models/ReportVM";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import { selectReport } from "./selectReport";

describe("Select Nomination Case", () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore({}, {}, {});
    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
  });

  it("has all rules unchecked", async () => {
    expect(selectReport(store.getState(), "report-id")).toEqual(aReportVM);
  });

  it("after checking a validation  rule, it has its rule checked", () => {
    const updateReportRuleParams: UpdateReportRuleParams = {
      reportId: aReport.id,
      ruleId: aReport.rules.management.TRANSFER_TIME.id,
      validated: false,
    };
    store.dispatch(
      updateReportRule.fulfilled(
        updateReportRuleParams,
        "",
        updateReportRuleParams,
      ),
    );

    expect(selectReport(store.getState(), "report-id")).toEqual<ReportVM>({
      ...aReportVM,
      rulesChecked: {
        ...aReportVM.rulesChecked,
        management: {
          ...aReportVM.rulesChecked.management,
          TRANSFER_TIME: {
            ...aReportVM.rulesChecked.management.TRANSFER_TIME,
            checked: true,
          },
        },
      },
    });
  });

  const aReport = new ReportBuilder()
    .with("id", "report-id")
    .with("name", "John Doe")
    .with("dueDate", new DateOnly(2030, 10, 30))
    .with("biography", "The biography.")
    .with("observers", [
      "observer 1",
      "observer 2\nVPI TJ Rennes\n(1 sur une liste de 2)",
    ])
    .buildRetrieveVM();
  const aReportVM = ReportBuilderVM.fromStoreModel(aReport)
    .withAllRulesChecked(false)
    .with("observers", [
      ["observer 1"],
      ["observer 2", "VPI TJ Rennes", "(1 sur une liste de 2)"],
    ])
    .build();
});
