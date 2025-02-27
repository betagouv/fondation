import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { retrieveReport } from "../../../core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import { selectFetchingReport } from "./selectReportQueryStatus";

describe("Select Report Query Status", () => {
  let store: ReduxStore;
  let isFetching: boolean;

  beforeEach(() => {
    store = initReduxStore({}, {}, {});
  });

  it("when there is no report in store, it should say it is being fetched", () => {
    selectIsFetching();
    expectIsFetching(true);
  });

  it("When a report is beeing queried, it should say it is being fetched", () => {
    dispatchPendingReport();
    selectIsFetching();
    expectIsFetching(true);
  });

  it("When a report has been queried, it should say it is fetched", () => {
    dispatchFulfilledReport();
    selectIsFetching();
    expectIsFetching(false);
  });

  it("When a report cannot be queried, it should say it is not being fetched", () => {
    dispatchRejectedReport();
    selectIsFetching();
    expectIsFetching(false);
  });

  describe("When the report is in the store", () => {
    beforeEach(() => {
      dispatchFulfilledReport();
    });

    it("it should say the report is not being fetched", () => {
      selectIsFetching();
      expectIsFetching(false);
    });

    it("When it is beeing queried, it should say it is being fetched", () => {
      dispatchPendingReport();
      selectIsFetching();
      expectIsFetching(true);
    });

    it("When it cannot be queried, it should say it is not being fetched", () => {
      dispatchRejectedReport();
      selectIsFetching();
      expectIsFetching(false);
    });
  });

  const dispatchPendingReport = () =>
    store.dispatch(retrieveReport.pending("", aReport.id, ""));
  const dispatchFulfilledReport = () =>
    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
  const dispatchRejectedReport = () =>
    store.dispatch(retrieveReport.rejected(new Error(), "", aReport.id));

  const selectIsFetching = () => {
    isFetching = selectFetchingReport(store.getState(), {
      reportId: aReport.id,
    });
  };

  const expectIsFetching = (expected: boolean) =>
    expect(isFetching).toBe(expected);
});

const aReport = new ReportBuilder().buildRetrieveSM();
