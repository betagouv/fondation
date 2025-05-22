import "@testing-library/jest-dom/vitest";
import { Editor } from "@tiptap/react";
import { TipTapEditorProvider } from "../../../../shared-kernel/adapters/primary/react/TipTapEditorProvider";
import { TextEditorProvider } from "../../../../shared-kernel/core-logic/providers/textEditor";
import { createExtensions } from "../../../adapters/primary/components/ReportOverview/TipTapEditor/extensions";
import {
  file1FileClientVM,
  file2FileClientVM,
  fileId1,
  fileId2,
  setupTestStore,
} from "./report-embed-screenshot.fixtures";

describe("Report Embed Screenshot", () => {
  let editor: TextEditorProvider;
  let deps: ReturnType<typeof setupTestStore>;

  beforeEach(() => {
    editor = new TipTapEditorProvider(
      new Editor({
        extensions: createExtensions(),
      }),
    );
    deps = setupTestStore(editor);
  });

  it("refuses to embed a .txt file", async () => {
    const file = deps.givenATxtFile();
    deps.expectUploadError(await deps.embedScreenshot(file), file.name);
  });

  it.each`
    getImageFile                        | format   | fileVM
    ${async () => deps.givenAPngFile()} | ${"png"} | ${file1FileClientVM}
    ${async () => deps.givenAJpgFile()} | ${"jpg"} | ${file2FileClientVM}
  `("allows a $format image", async ({ getImageFile, fileVM }) => {
    deps.fileApiClient.signedUrlsVM = [fileVM];
    const screenshot = await getImageFile();
    expect((await deps.embedScreenshot(screenshot)).meta.requestStatus).toEqual(
      "fulfilled",
    );
  });

  it("stores screenshots with its signed URLs", async () => {
    const screenshot1 = await deps.givenAPngFile();
    const screenshot2 = await deps.givenAJpgFile();

    await deps.embedScreenshot(screenshot1, screenshot2);

    deps.expectStoredScreenshots(
      {
        fileId: fileId1,
        name: file1FileClientVM.name,
        signedUrl: file1FileClientVM.signedUrl,
      },
      {
        fileId: fileId2,
        name: file2FileClientVM.name,
        signedUrl: file2FileClientVM.signedUrl,
      },
    );
  });

  it("deletes a screenshot from the editor if upload failed", async () => {
    const screenshot = await deps.givenAJpgFile();
    deps.reportApiClient.uploadFilesError = new Error("Upload error");

    await deps.embedScreenshot(screenshot);

    expect(editor.isEmpty()).toBe(true);
  });
});
