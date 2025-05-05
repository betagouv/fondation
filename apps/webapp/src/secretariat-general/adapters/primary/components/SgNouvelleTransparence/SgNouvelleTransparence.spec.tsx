import { render, screen } from "@testing-library/react";
import { SgNouvelleTransparence } from "./SgNouvelleTransparence";
import { Magistrat } from "shared-models";
import { formationToLabel } from "../../../../../reports/adapters/primary/labels/labels-mappers";

const renderNouvelleTransparence = () => {
  render(<SgNouvelleTransparence />);
};

describe("SgNouvelleTransparence", () => {
  it("should render", () => {
    renderNouvelleTransparence();
  });

  it("display a form to create new transparence", async () => {
    renderNouvelleTransparence();

    expect(
      await screen.findByLabelText("Nom de la transparence"),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText("Formation")).toBeInTheDocument();
    expect(
      await screen.findByLabelText(formationToLabel(Magistrat.Formation.SIEGE)),
    ).toBeInTheDocument();
    expect(
      await screen.findByLabelText(
        formationToLabel(Magistrat.Formation.PARQUET),
      ),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText("Date d'échéance")).toBeInTheDocument();
    expect(await screen.findByText("Annuler")).toBeInTheDocument();
    expect(await screen.findByText("Enregistrer")).toBeInTheDocument();
  });
});
