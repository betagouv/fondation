import { expect, MountResult, test } from "@playwright/experimental-ct-react";
import {
  Locator,
  logPlaywrightBrowser,
  Mount,
  Page,
} from "../../../../../../test/playwright";
import { ReportOverviewReportForTest } from "./ReportOverviewReport.story";
import { AppState } from "../../../../../../store/appState";
import { ReduxStore } from "../../../../../../store/reduxStore";
import { sleep } from "../../../../../../shared-kernel/core-logic/sleep";

declare const window: {
  store: ReduxStore;
} & Window;

const label = "Rapport";

test.describe("Report Overview Report", () => {
  let component: MountResult | null;
  let initialState: AppState;
  let editor: Locator;
  let page: Page;
  let mount: Mount;

  test.beforeEach(({ page: aPage, mount: aMount }) => {
    component = null;
    page = aPage;
    logPlaywrightBrowser(page);
    mount = aMount;
  });

  test("should show a basic report", async () => {
    await renderReport("Some content");

    await expectContent("Some content");
    await expectStoredReport("Some content");
  });

  test("should remove the report content", async () => {
    await renderReport("Some content");

    await editor.clear();

    await expectContent("");
    await expectStoredReport("<p></p>");
  });

  test("should write content to an empty report", async () => {
    await renderReport(null);

    await editor.fill("New content");

    await expectContent("New content");
    await expectStoredReport("<p>New content</p>");
  });

  test("should keep the cursor position after typing and saves the new content", async () => {
    await renderReport(null);

    await editor.fill("Prefix !");
    await expectStoredReport("<p>Prefix !</p>");

    await editor.press("ArrowLeft");
    await editor.pressSequentially("the content");
    await expectContent("Prefix the content!");
    await expectStoredReport("<p>Prefix the content!</p>");
  });

  [
    {
      markTitle: "Gras",
      expectedHtmlContent: "<p><strong>content</strong></p>",
    },
    {
      markTitle: "Italique",
      expectedHtmlContent: "<p><em>content</em></p>",
    },
    {
      markTitle: "Souligné",
      expectedHtmlContent: "<p><u>content</u></p>",
    },
  ].forEach(({ markTitle, expectedHtmlContent }) => {
    test(`should mark the content in: ${markTitle}`, async () => {
      await renderReport("content");

      const text = editor.getByText("content");
      await text.selectText();
      await component!.getByTitle(markTitle).click();

      await expectContent("content");
      await expectStoredReport(expectedHtmlContent);
    });
  });

  const expectContent = (content: string) => expect(editor).toHaveText(content);

  const expectStoredReport = async (content: string | null) => {
    await sleep(400); // Wait for debouced store update

    const state = await page.evaluate(() => window.store.getState());

    const expecteState: AppState = {
      ...initialState,
      reportOverview: {
        ...initialState.reportOverview,
        byIds: {
          "report-id": {
            ...initialState.reportOverview.byIds!["report-id"]!,
            comment: content,
          },
        },
      },
    };

    expect(state).toEqual(expecteState);
  };

  const renderReport = async (content: string | null) => {
    component = await mount(<ReportOverviewReportForTest content={content} />);
    editor = reportEditor();

    initialState = await page.evaluate(() => window.store.getState());
  };

  const reportEditor = () => component!.getByLabel(label, { exact: true });
});
