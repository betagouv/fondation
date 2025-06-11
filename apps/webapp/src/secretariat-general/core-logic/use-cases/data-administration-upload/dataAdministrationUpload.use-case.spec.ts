import {
  getTestDependencies,
  TestDependencies,
} from "./dataAdministrationUpload.test-setup";

describe("Data Administration Upload", () => {
  let deps: TestDependencies;

  beforeEach(async () => {
    deps = getTestDependencies();
  });

  it("upload une transparence", async () => {
    await deps.uploadTransparence(deps.uneTransparenceAImporter());
    deps.expectClientTransparences(deps.uneTransparenceImportée());
  });

  it("refuses les formats non autorisés", async () => {
    await deps.uploadTransparence(deps.unFichierPdfAImporter());
    deps.expectClientTransparences();
  });
});
