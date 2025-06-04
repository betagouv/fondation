import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getTestDependencies, TestDependencies } from "./AppRouter.test-deps";

describe("Composant Routeur de l'Application", () => {
  let deps: TestDependencies;

  beforeEach(() => {
    deps = getTestDependencies();
  });

  it("affiche la page de connexion par défaut", async () => {
    deps.renderAppRouter();
    await deps.expectLoginPage();
  });

  it("ne peut pas accéder à la page des transparences", async () => {
    deps.renderAppRouter();
    await deps.visit("/transparences");
    await deps.expectLoginPage();
  });

  it("ne peut pas afficher la page de liste des rapports avant la redirection", async () => {
    deps.initStoreNoRouteChangedHandler();
    deps.renderAppRouter();

    act(() => {
      deps.routerProvider.goToTransparencies();
    });

    await expect(screen.findByText("transparencies")).rejects.toThrow();
  });

  describe("Adjoint Secrétaire Général authentifié", () => {
    it("n'accède pas aux rapports des membres", async () => {
      deps.renderAppRouter();
      await deps.givenAnAuthenticatedAdjointSecrétaireGénéral();

      await deps.visitSomeReport();

      await deps.expectDisallowedGdsReportPage();
    });

    it("accède à la page du tableau de bord du secrétariat général", async () => {
      deps.renderAppRouter();
      await deps.givenAnAuthenticatedAdjointSecrétaireGénéral();

      await deps.visit("/secretariat-general");

      await screen.findByText("Tableau de bord");
      expect(window.location.pathname).toBe("/secretariat-general");
    });

    it("accède à la page de nouvelle transparence du secrétariat général", async () => {
      deps.renderAppRouter();
      await deps.givenAnAuthenticatedAdjointSecrétaireGénéral();

      await deps.visit("/secretariat-general/nouvelle-transparence");

      expect(window.location.pathname).toBe(
        "/secretariat-general/nouvelle-transparence",
      );
    });
  });

  describe("Membre authentifié", () => {
    it("n'accède pas à la page du tableau de bord du secrétariat général", async () => {
      deps.renderAppRouter();
      await deps.givenAnAuthenticatedMembre();

      await deps.visit("/secretariat-general");

      await expect(screen.findByText("Tableau de bord")).rejects.toThrow();
    });

    it("n'accède pas à la page de nouvelle transparence du secrétariat général", async () => {
      deps.renderAppRouter();
      await deps.givenAnAuthenticatedMembre();

      await deps.visit("/secretariat-general/nouvelle-transparence");

      await expect(
        screen.findByText("Nouvelle transparence"),
      ).rejects.toThrow();
    });

    it("accède à la page des transparences par défaut", async () => {
      deps.renderAppRouter();
      await deps.givenAnAuthenticatedMembre();
      await deps.expectTransparenciesPage();
    });

    it("redirige l'URL racine vers la page des transparences", async () => {
      deps.renderAppRouter();
      await deps.givenAnAuthenticatedMembre();

      await deps.visit("/");

      await deps.expectTransparenciesPage();
    });

    it("redirige depuis la page de connexion vers la page des transparences", async () => {
      deps.renderAppRouter();
      await deps.givenAnAuthenticatedMembre();

      await deps.visit("/login");

      await deps.expectTransparenciesPage();
    });

    it("accède à la page de liste des rapports filtrée par transparence", async () => {
      deps.renderAppRouter();
      await deps.givenAnAuthenticatedMembre();

      await deps.visitTransparencyPerFormationReports();

      await deps.expectGdsReportsListPage();
    });

    it("redirige depuis '/dossiers-de-nomination' vers la page des transparences", async () => {
      deps.renderAppRouter();
      await deps.givenAnAuthenticatedMembre();

      await deps.visit("/dossiers-de-nomination");

      await deps.expectTransparenciesPage();
    });

    it("accède à la page de détail du rapport", async () => {
      deps.renderAppRouter();
      await deps.givenAnAuthenticatedMembre();

      await deps.visitSomeReport();

      await deps.expectGdsReportPage();
    });

    const logoutTestData: {
      elementIndex: number;
      device: "desktop" | "mobile";
    }[] = [
      { elementIndex: 0, device: "desktop" },
      { elementIndex: 1, device: "mobile" },
    ];
    it.each(logoutTestData)(
      "sur $device, déconnecte l'utilisateur et le redirige vers la page de connexion",
      async ({ elementIndex }) => {
        deps.renderAppRouter();
        await deps.givenAnAuthenticatedMembre();

        await userEvent.click(
          screen.getAllByText("Se déconnecter")[elementIndex]!,
        );
        await deps.waitListenersCompletion();

        await deps.expectLoginPage();
      },
    );
  });
});
