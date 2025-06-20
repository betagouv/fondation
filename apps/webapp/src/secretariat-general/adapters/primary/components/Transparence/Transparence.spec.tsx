import { screen } from "@testing-library/react";
import { TestDeps } from "./Transparence.test-deps";
import { getTransparenceCompositeId } from "../../../../core-logic/models/transparence.model";

describe("Transparence Component", () => {
  let deps: TestDeps;

  beforeEach(() => {
    deps = new TestDeps();
  });

  it("indique que la transpa n'a pas été trouvée", async () => {
    deps.renderTransparenceByCompositeId("invalid-id");
    await screen.findByText("Session de type Transparence non trouvée.");
  });

  describe("Avec une transparence existante", () => {
    beforeEach(() => {
      deps.givenUneTransparenceParquet();
    });

    it("affiche la transparence avec les données correctes", async () => {
      deps.renderTransparenceByCompositeId(
        getTransparenceCompositeId(
          deps.uneTransparenceParquet.nom,
          deps.uneTransparenceParquet.formation,
          deps.uneTransparenceParquet.dateTransparence,
        ),
      );

      await screen.findByText("Type de session");
      screen.getByText("Transparence");

      screen.getByText("Nom de la session");
      screen.getByText(deps.uneTransparenceParquet.nom);

      screen.getByText("Formation");
      screen.getByText("Parquet");

      screen.getByText("Date de la session");
      screen.getByText("01/10/2023");

      screen.getByText("Clôture du délai d'observation");
      screen.getByText("15/10/2023");
    });
  });
});
