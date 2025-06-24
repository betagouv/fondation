import { expect, MountResult, test } from "@playwright/experimental-ct-react";
import { sleep } from "../../../../../../shared-kernel/core-logic/sleep";
import { AppState, ReportScreenshotSM } from "../../../../../../store/appState";
import { ReduxStore } from "../../../../../../store/reduxStore";
import {
  Locator,
  logPlaywrightBrowser,
  Mount,
  Page,
} from "../../../../../../test/playwright";
import { FakeReportApiClient } from "../../../../secondary/gateways/FakeReport.client";
import { ReportEditorForTest } from "./ReportEditor.story";

declare const window: {
  store: ReduxStore;
  serializedReport: string;
} & Window;

const label = "Rapport";

test.describe("Report Editor", () => {
  let component: MountResult | null;
  let initialState: AppState<true>;
  let editor: Locator;
  let page: Page;
  let mount: Mount;

  test.beforeEach(({ page: aPage, mount: aMount }) => {
    component = null;
    page = aPage;
    logPlaywrightBrowser(page);
    mount = aMount;
  });

  test.afterEach(async ({ page }) => {
    // Manual closing because this open issue:
    // https://github.com/microsoft/playwright/issues/31050
    await page.close();
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

  const testParams: {
    testTitle: string;
    action: () => Promise<void>;
    previousContent?: string;
    expectedContent?: string;
    getHtmlContent: () => Promise<string | null | undefined>;
    expectHtmlContent?: (content: string) => Promise<void>;
    expectedStoredHtmlContent: string;
    expectedStoredFiles?: Omit<ReportScreenshotSM, "fileId">[];
  }[] = [
    {
      testTitle: "Mark text in bold",
      action: async () => {
        await selectText();
        await clickOnMark("Gras");
      },
      getHtmlContent: () => queryHtmlContent("strong"),
      expectedStoredHtmlContent: "<p><strong>content</strong></p>",
    },
    {
      testTitle: "Mark text in italic",
      action: async () => {
        await selectText();
        await clickOnMark("Italique");
      },
      getHtmlContent: () => queryHtmlContent("em"),
      expectedStoredHtmlContent: "<p><em>content</em></p>",
    },
    {
      testTitle: "Underline text",
      action: async () => {
        await selectText();
        await clickOnMark("Souligner");
      },
      getHtmlContent: () => queryHtmlContent("u"),
      expectedStoredHtmlContent: "<p><u>content</u></p>",
    },
    [1, 2, 3].map((level) => ({
      testTitle: `Put text in Title ${level}`,
      action: async () => {
        await selectText();
        await clickOnMark("H" + level);
      },
      getHtmlContent: () =>
        editor!.getByRole("heading", { level }).textContent(),
      expectedStoredHtmlContent: `<h${level}>content</h${level}>`,
    })),
    {
      testTitle: "Highlight text",
      action: async () => {
        await selectText();
        await clickOnMark("Surligner");
      },
      getHtmlContent: () => queryHtmlContent("mark"),
      expectedStoredHtmlContent: "<p><mark>content</mark></p>",
    },
    {
      testTitle: "Add a bullet point",
      action: async () => {
        await selectText();
        await clickOnMark("Liste à puces");
      },
      getHtmlContent: () => queryHtmlContent("ul > li > p"),
      expectedStoredHtmlContent: "<ul><li><p>content</p></li></ul>",
    },
    {
      testTitle: "Increase bullet point indentation",
      action: async () => {
        await selectText();
        await clickOnMark("Augmenter le retrait");
      },
      previousContent:
        "<ul><li><p>prev-item-</p></li><li><p>content</p></li></ul>",
      expectedContent: "prev-item-content",
      getHtmlContent: () => queryHtmlContent("ul > li > ul > li > p"),
      expectedStoredHtmlContent:
        "<ul><li><p>prev-item-</p><ul><li><p>content</p></li></ul></li></ul>",
    },
    {
      testTitle: "Decrease bullet point indentation",
      action: async () => {
        await selectText();
        await clickOnMark("Diminuer le retrait");
      },
      previousContent: "<ul><li><p>content</p></li></ul>",
      getHtmlContent: () => queryHtmlContent(".ProseMirror p"),
      expectedStoredHtmlContent: "<p>content</p>",
    },
    {
      testTitle: "Add an ordered list",
      action: async () => {
        await selectText();
        await clickOnMark("Liste ordonnée");
      },
      getHtmlContent: () => queryHtmlContent("ol > li > p"),
      expectedStoredHtmlContent: "<ol><li><p>content</p></li></ol>",
    },
    {
      testTitle: "Add color to a text",
      action: async () => {
        await selectText();
        await clickOnMark("Couleur du texte");
        await page
          .locator("input[type=color]")
          // L'input est caché, on force donc le remplissage
          .fill("#18753c", { force: true });
      },
      getHtmlContent: () => queryHtmlContent(".ProseMirror span"),
      expectHtmlContent: async (content: string) => {
        expect(content).toEqual("content");
        await expectGreenCss();
      },
      expectedStoredHtmlContent:
        '<p><span style="color: #18753c">content</span></p>',
    },
    {
      testTitle: "Higlight with colored text",
      action: async () => {
        await selectText();
        await clickOnMark("Surligner");
      },
      previousContent: '<p><span style="color: #18753c">content</span></p>',
      // Ordre important : le span doit être dans le mark
      // pour que la couleur soit visible
      getHtmlContent: () => queryHtmlContent(".ProseMirror mark > span"),
      expectHtmlContent: async (content: string) => {
        expect(content).toEqual("content");
        await expectGreenCss();
      },
      expectedStoredHtmlContent:
        '<p><mark><span style="color: rgb(24, 117, 60)">content</span></mark></p>',
    },
    {
      testTitle: "Add screenshot with paste action",
      action: async () => {
        await page.evaluate(async () => {
          const response = await fetch("https://fakeimg.pl/10x10/");
          const blob = await response.blob();

          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
        });
        await selectText();
        await editor.press("ArrowRight");
        await editor.press("Control+v");
      },
      getHtmlContent: () => queryHtmlContent(".ProseMirror > div > div"),
      expectHtmlContent: async (content: string) => {
        const expectedHtml = `<img src="${FakeReportApiClient.BASE_URI}/image.png-10" data-file-name="image.png-10" data-is-screenshot="true" class="editor-resizable-image">`;
        expect(content).toEqual(expectedHtml);
      },
      expectedStoredHtmlContent: `<p>content</p><img src="${FakeReportApiClient.BASE_URI}/image.png-10" data-file-name="image.png-10" data-is-screenshot="true" class="editor-resizable-image">`,
      expectedStoredFiles: [
        {
          name: "image.png-10",
          signedUrl: "https://example.fr/image.png-10",
        },
      ],
    },
  ].flat();

  testParams.forEach(
    ({
      testTitle,
      action,
      expectedContent,
      getHtmlContent,
      previousContent,
      expectHtmlContent,
      expectedStoredHtmlContent,
      expectedStoredFiles,
    }) => {
      test(testTitle, async () => {
        await renderReport(previousContent || "content");

        await editor.focus();
        await action();

        await expectContent(expectedContent ?? "content");
        await expectStoredReport(
          expectedStoredHtmlContent,
          expectedStoredFiles,
        );

        const htmlContent = (await getHtmlContent())!;
        if (expectHtmlContent) {
          await expectHtmlContent(htmlContent);
        } else {
          expect(htmlContent).toEqual("content");
        }
      });
    },
  );

  test("Add screenshots using the upload button", async () => {
    await renderReport("content");

    await editor.focus();
    await selectText();
    await editor.press("ArrowRight");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await clickOnMark("Ajouter une capture d'écran");
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles([
      {
        name: "image.png",
        mimeType: "image/png",
        buffer: Buffer.from(""),
      },
      {
        name: "image2.png",
        mimeType: "image/png",
        buffer: Buffer.from(""),
      },
    ]);

    await expectContent("content");

    const expectedStoredHtmlContent =
      `<p>content</p>` +
      `<img src="${FakeReportApiClient.BASE_URI}/image2.png-10" data-file-name="image2.png-10" data-is-screenshot="true" class="editor-resizable-image">` +
      `<img src="${FakeReportApiClient.BASE_URI}/image.png-10" data-file-name="image.png-10" data-is-screenshot="true" class="editor-resizable-image">`;
    const expectedStoredFiles = [
      {
        name: "image.png-10",
        signedUrl: `${FakeReportApiClient.BASE_URI}/image.png-10`,
      },
      {
        name: "image2.png-10",
        signedUrl: `${FakeReportApiClient.BASE_URI}/image2.png-10`,
      },
    ];
    await expectStoredReport(expectedStoredHtmlContent, expectedStoredFiles);

    const expectedHtml = [
      `<img src="${FakeReportApiClient.BASE_URI}/image2.png-10" data-file-name="image2.png-10" data-is-screenshot="true" class="editor-resizable-image">`,
      `<img src="${FakeReportApiClient.BASE_URI}/image.png-10" data-file-name="image.png-10" data-is-screenshot="true" class="editor-resizable-image">`,
    ];
    const htmlContent = (await queryAllHtmlContent(
      ".ProseMirror > div > div",
    ))!;
    expect(htmlContent).toEqual(expectedHtml);
  });

  [
    [() => editor.press("Control+z"), "Control+z"] as const,
    [() => clickOnMark("Annuler"), "a button click"] as const,
  ].forEach(([undo, key]) => {
    test(`Undo a text modification with ${key}`, async () => {
      await renderReport("content");
      await writeAtTheEnd(" with modification");
      await expectStoredReport("<p>content with modification</p>");

      await undo();

      await expectContent("content");
      await expectStoredReport("<p>content</p>");
    });
  });

  [
    [() => editor.press("Control+Shift+z"), "Control+Shift+z"] as const,
    [() => clickOnMark("Rétablir"), "a button click"] as const,
  ].forEach(([redo, key]) => {
    test(`Redo a text modification with ${key}`, async () => {
      await renderReport("content");
      await writeAtTheEnd(" with modification");
      await expectStoredReport("<p>content with modification</p>");

      await editor.press("Control+z");
      await expectContent("content");
      await redo();

      await expectStoredReport("<p>content with modification</p>");
    });
  });

  test("disable the bold mark on a Title 2 line", async () => {
    await renderReport("<h2>content</h2>");
    await selectText();
    await expect(component!.getByTitle("Gras")).toBeDisabled();
  });

  test("all buttons are disabled when editor isn't focused", async () => {
    await renderReport("content");

    const titles = [
      "Gras",
      "Italique",
      "Souligner",
      "H1",
      "H2",
      "H3",
      "Surligner",
      "Liste à puces",
      "Liste ordonnée",
      "Couleur du texte",
      "Augmenter le retrait",
      "Diminuer le retrait",
    ];
    for (const title of titles)
      await expect(component!.getByTitle(title)).toBeDisabled();
  });

  test("Text color button is gray when editor isn't focused", async () => {
    await renderReport(
      '<p><span style="color: rgb(24, 117, 60)">content</span></p>',
    );
    await selectText();
    await expect(getColorButton()).toHaveCSS("color", "rgb(24, 117, 60)");

    await component?.getByRole("heading", { name: "Rapport" }).click();

    await expect(getColorButton()).toHaveCSS("color", "rgb(146, 146, 146)");
  });

  const getColorButton = () => component!.getByTitle("Couleur du texte");

  const writeAtTheEnd = async (text: string) => {
    await editor.focus();
    await editor.press("End");
    await editor.pressSequentially(text);
  };

  const selectText = async () => {
    const text = editor.getByText("content");
    await text.selectText();
  };

  const clickOnMark = async (testTitle: string) =>
    component!.getByTitle(testTitle).click();

  const queryHtmlContent = (queryString: string) =>
    page.evaluate(
      (query) => document.querySelector(query)?.innerHTML,
      queryString,
    );

  const queryAllHtmlContent = (queryString: string) =>
    page.evaluate(
      (query) =>
        [...document.querySelectorAll(query).values()].map(
          (node) => node.innerHTML,
        ),
      queryString,
    );

  const expectGreenCss = () =>
    expect(component!.getByText("content")).toHaveCSS(
      "color",
      "rgb(24, 117, 60)",
    );

  const expectContent = (content: string) => expect(editor).toHaveText(content);

  const expectStoredReport = async (
    content: string | null,
    screenshots?: Omit<ReportScreenshotSM, "fileId">[],
  ) => {
    await sleep(1000); // Wait for debouced store update

    const state = await page.evaluate(() => window.store.getState());

    const expecteState: AppState<true> = {
      ...initialState,
      reportOverview: {
        ...initialState.reportOverview,
        byIds: {
          "report-id": {
            ...initialState.reportOverview.byIds!["report-id"]!,
            comment: content,
            contentScreenshots: screenshots
              ? {
                  files: screenshots.map(
                    (screenshot) =>
                      ({
                        name: screenshot.name,
                        fileId: expect.any(String),
                        signedUrl: screenshot.signedUrl,
                      }) as unknown as ReportScreenshotSM,
                  ),
                }
              : null,
          },
        },
      },
    };

    expect(state).toEqual(expecteState);
  };

  const renderReport = async (content: string | null) => {
    component = await mount(<ReportEditorForTest content={content} />);
    editor = reportEditor();

    initialState = await page.evaluate(() => window.store.getState());
  };

  const reportEditor = () => component!.getByLabel(label, { exact: true });
});
