import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { AllRulesMap, NominationFile } from "shared-models";
import { AppState } from "../../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../../store/reduxStore";
import { ReportBuilder } from "../../../../core-logic/builders/Report.builder";
import {
  ReportApiModel,
  ReportApiModelBuilder,
} from "../../../../core-logic/builders/ReportApiModel.builder";
import { reportFileAttached } from "../../../../core-logic/listeners/report-file-attached.listeners";
import { ReportVM } from "../../../../core-logic/view-models/ReportVM";
import { ApiReportGateway } from "../../../secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../secondary/gateways/FakeReport.client";
import { ReportOverview } from "./ReportOverview";

const testRulesMap = {
  [NominationFile.RuleGroup.MANAGEMENT]: [
    NominationFile.ManagementRule.TRANSFER_TIME,
    NominationFile.ManagementRule.CASSATION_COURT_NOMINATION,
  ],
  [NominationFile.RuleGroup.STATUTORY]: [],
  [NominationFile.RuleGroup.QUALITATIVE]: [],
} as const satisfies AllRulesMap;

describe("Report Overview Component - Report section", () => {
  let store: ReduxStore;
  let initialState: AppState;
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
      { reportFileAttached },
      undefined,
      testRulesMap,
    );
    initialState = store.getState();

    reportApiModelBuilder = new ReportApiModelBuilder(testRulesMap);
  });

  describe("Report text section", () => {
    let textarea: HTMLDivElement | undefined;
    const newContent = "New content";
    const label = ReportVM.commentLabel;
    const storeKey = "comment";
    const placeholder = ReportVM.commentPlaceholder;

    beforeEach(() => {
      textarea = undefined;
    });

    it.skipIf(!placeholder)(
      "shows the placeholder when there is no content",
      async () => {
        const aReport = reportApiModelBuilder
          .with("id", "without-comment")
          .with("comment", null)
          .build();
        givenARenderedReport(aReport);
        textarea = await givenTheTextArea();

        expect(textarea).toHaveValue("");
        expect(textarea).toHaveAttribute(
          "placeholder",
          ReportVM.commentPlaceholder,
        );
      },
    );

    it.only("writes content", async () => {
      const reportApiModel = reportApiModelBuilder
        .with("comment", null)
        .build();
      givenARenderedReport(reportApiModel);

      textarea = await givenTheTextArea();

      screen.debug(textarea);
      await typeNewBiographyText();
      screen.debug(textarea);

      // expect(textarea).toHaveValue(newContent);
    });

    it("removes content", async () => {
      const reportApiModel = reportApiModelBuilder.build();
      const aReportSM =
        ReportBuilder.fromApiModel(reportApiModel).buildRetrieveSM();
      givenARenderedReport(reportApiModel);

      textarea = await givenTheTextArea();
      await userEvent.clear(textarea!);

      expect(textarea).toHaveValue("");
      await waitFor(() => {
        expect(store.getState()).toEqual<AppState>({
          ...initialState,
          reportOverview: {
            ...initialState.reportOverview,
            byIds: {
              [reportApiModel.id]: {
                ...aReportSM,
                [storeKey]: null,
              },
            },
          },
        });
      });
    });

    it("keeps the cursor position after typing and saves the new content", async () => {
      const reportApiModel = reportApiModelBuilder.build();
      const aReportVM =
        ReportBuilder.fromApiModel(reportApiModel).buildRetrieveSM();
      givenARenderedReport(reportApiModel);

      textarea = await givenTheTextArea();
      await typeNewBiographyText();
      moveToCursorPosition(3);
      await userEvent.keyboard(":");
      const newContentAfterCursorTyping =
        newContent.slice(0, 3) + ":" + newContent.slice(3);

      expectCursorPosition(4);
      expect(textarea).toHaveValue(newContentAfterCursorTyping);
      await waitFor(() => {
        expect(store.getState()).toEqual<AppState>({
          ...initialState,
          reportOverview: {
            ...initialState.reportOverview,
            byIds: {
              [reportApiModel.id]: {
                ...aReportVM,
                [storeKey]: newContentAfterCursorTyping,
              },
            },
          },
        });
      });
      expectCursorPosition(4);
    });

    const typeNewBiographyText = async () => {
      // await userEvent.clear(textarea!);
      await userEvent.type(textarea!, newContent);
    };

    const givenTheTextArea = async () => {
      const container = (await screen.findByLabelText(label)) as HTMLDivElement;
      return container.firstChild as HTMLDivElement;
    };

    const moveToCursorPosition = (position: number) => {
      textarea!.focus();
      textarea!.setSelectionRange(position, position);
    };

    const expectCursorPosition = (position: number) => {
      expect(textarea!.selectionStart).toBe(position);
      expect(textarea!.selectionEnd).toBe(position);
    };
  });

  const givenARenderedReport = (report: ReportApiModel) => {
    reportApiClient.reports = {};
    reportApiClient.addReport(report);

    render(
      <Provider store={store}>
        <ReportOverview id={report.id} />
      </Provider>,
    );
  };
});
