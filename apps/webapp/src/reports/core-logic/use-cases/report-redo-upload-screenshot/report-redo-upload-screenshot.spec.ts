import "@testing-library/jest-dom/vitest";
import {
  file1FileClientVM,
  file2FileClientVM,
  fileId1,
  fileId2,
  setupTestStore,
} from "./report-redo-upload-screenshot.fixtures";
import { StubEditorProvider } from "../../../../shared-kernel/adapters/primary/react/StubEditorProvider";

describe("Report Redo Upload Screenshot", () => {
  let deps: ReturnType<typeof setupTestStore>;

  beforeEach(() => {
    const editor = new StubEditorProvider();
    deps = setupTestStore(editor);
  });

  it("refuses to embed a .txt file", async () => {
    const file = deps.givenATxtFile();
    deps.expectUploadError(await deps.redoUploadScreenshot(file), file.name);
  });

  it.each`
    getImageFile                        | format   | fileVM
    ${async () => deps.givenAPngFile()} | ${"png"} | ${file1FileClientVM}
    ${async () => deps.givenAJpgFile()} | ${"jpg"} | ${file2FileClientVM}
  `("allows a $format image", async ({ getImageFile, fileVM }) => {
    deps.fileApiClient.signedUrlsVM = [fileVM];
    const screenshot = await getImageFile();
    expect(
      (await deps.redoUploadScreenshot(screenshot)).meta.requestStatus,
    ).toEqual("fulfilled");
  });

  it("stores screenshots with its signed URLs", async () => {
    const screenshot1 = await deps.givenAPngFile();
    const screenshot2 = await deps.givenAJpgFile();

    await deps.redoUploadScreenshot(screenshot1, screenshot2);

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

  it("replaces the image URLs in the editor", async () => {
    const screenshot1 = await deps.givenAPngFile();
    deps.fileApiClient.signedUrlsVM = [file1FileClientVM];

    await deps.redoUploadScreenshot(screenshot1);

    expect(deps.editor.imagesUrls).toEqual([
      {
        name: file1FileClientVM.name,
        url: file1FileClientVM.signedUrl,
      },
    ]);
  });
});
