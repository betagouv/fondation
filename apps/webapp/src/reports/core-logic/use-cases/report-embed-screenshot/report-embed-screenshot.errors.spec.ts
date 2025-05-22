import "@testing-library/jest-dom/vitest";
import { StubEditorProvider } from "../../../../shared-kernel/adapters/primary/react/StubEditorProvider";
import {
  file1FileClientVM,
  setupTestStore,
} from "./report-embed-screenshot.fixtures";

describe("Report Embed Screenshot", () => {
  let editor: StubEditorProvider;
  let deps: ReturnType<typeof setupTestStore>;

  beforeEach(() => {
    editor = new StubEditorProvider();
    deps = setupTestStore(editor);
    deps.fileApiClient.signedUrlsVM = [file1FileClientVM];
  });

  it("deletes the uploaded screenshot", async () => {
    const screenshot = await deps.givenAPngFile();
    editor.setImagesSuccess = false;

    await deps.embedScreenshot(screenshot);

    deps.expectStoredScreenshots();
  });
});
