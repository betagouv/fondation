import { TestDependencies } from "./importObservantsXlsx.test-setup";

describe("Data Administration Upload", () => {
  let deps: TestDependencies;

  beforeEach(async () => {
    deps = new TestDependencies();
  });

  it("mets à jour les observants d'une transparence", async () => {
    await deps.importObservants(deps.uneTransparenceAImporter());
    deps.expectSuccessfulUpload();
  });

  it("refuses les formats non autorisés", async () => {
    await deps.importObservants(deps.unFichierPdfAImporter());
    deps.expectFailedUpload();
  });

  it("stocke un message d'erreur si l'import échoue", async () => {
    deps.dataAdministrationClient.importObservantsXlsxError = new Error();
    await deps.importObservants(deps.uneTransparenceAImporter());
    deps.expectFailedUpload();
  });

  it("réinitialise l'état d'upload après avoir changé de page", async () => {
    deps.givenAFailedUpload();
    deps.routeChangedToNouvelleTransparence();
    deps.expectResetUploadQueryStatus();
  });

  it("stocke les erreurs de validation", async () => {
    deps.dataAdministrationClient.stubValidationError = {
      validationError: "Erreur de validation",
    };
    await deps.importObservants(deps.uneTransparenceAImporter());
    deps.expectValidationError("Erreur de validation");
  });
});
