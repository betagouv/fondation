import { setupTestEditor } from "./TipTapEditorProvider.fixtures";

describe("TipTapEditorProvider", () => {
  let deps: ReturnType<typeof setupTestEditor>;

  beforeEach(() => {
    deps = setupTestEditor();
  });

  describe("With an image", () => {
    beforeEach(() => {
      deps.editorWithImage();
    });

    it("persists existing images", async () => {
      await deps.editorProvider.persistImages();
      deps.expectImagePersisted();
    });
  });
});
