import { TestDependencies } from "./dataAdministrationUpload.test-setup";

describe("Data Administration Upload", () => {
  let deps: TestDependencies;

  beforeEach(async () => {
    deps = new TestDependencies();
  });

  it("upload une transparence", async () => {
    await deps.uploadTransparence(deps.uneTransparenceAImporter());
    deps.expectClientTransparences(deps.uneTransparenceImportée());
  });

  it("refuses les formats non autorisés", async () => {
    await deps.uploadTransparence(deps.unFichierPdfAImporter());
    deps.expectClientTransparences();
  });

  it("redirige vers la page de la transparence après l'import", async () => {
    deps.routerProvider.gotToSgTransparence = vi.fn();
    await deps.uploadTransparence(deps.uneTransparenceAImporter());
    deps.expectPageTransparence();
  });

  it("stocke un message d'erreur si l'import échoue", async () => {
    deps.dataAdministrationClient.importNouvelleTransparenceXlsxError =
      new Error();
    await deps.uploadTransparence(deps.uneTransparenceAImporter());
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
    await deps.uploadTransparence(deps.uneTransparenceAImporter());
    deps.expectValidationError("Erreur de validation");
  });
});
