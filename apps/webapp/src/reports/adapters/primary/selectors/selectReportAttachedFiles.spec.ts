import { ReportBuilder } from "../../../core-logic/builders/Report.builder";
import { generateReportFileUrl } from "../../../core-logic/use-cases/report-file-url-generation/generate-report-file-url";
import { retrieveReport } from "../../../core-logic/use-cases/report-retrieval/retrieveReport.use-case";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { selectReportAttachedFiles } from "./selectReportAttachedFiles";

describe("Select Report Attached Files", () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore({}, {}, {});
    store.dispatch(retrieveReport.fulfilled(aReport, "", ""));
    store.dispatch(
      generateReportFileUrl.fulfilled("http://example.fr/test.pdf", "", {
        reportId: aReport.id,
        fileName: "test.pdf",
      }),
    );
  });

  it("selects a list of signed urls and names", async () => {
    expect(selectReportAttachedFiles(store.getState(), aReport.id)).toEqual([
      {
        name: "test.pdf",
        signedUrl: "http://example.fr/test.pdf",
      },
    ]);
  });
});

const aReport = new ReportBuilder().buildRetrieveVM();
