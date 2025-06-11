import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Provider } from "react-redux";
import { Magistrat } from "shared-models";
import { formationToLabel } from "../../../../../reports/adapters/primary/labels/labels-mappers";
import { StubRouterProvider } from "../../../../../router/adapters/stubRouterProvider";
import { initReduxStore, ReduxStore } from "../../../../../store/reduxStore";
import {
  ExpectSecretariatGeneralBreadcrumb,
  expectSecretariatGeneralBreadcrumbFactory,
} from "../../../../../test/breadcrumb";
import NouvelleTransparence from "./NouvelleTransparence";

const renderNouvelleTransparence = (store: ReduxStore) => {
  render(
    <Provider store={store}>
      <NouvelleTransparence />
    </Provider>,
  );
};

describe("NouvelleTransparence", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;
  let expectSecretariatGeneralBreadcrumb: ExpectSecretariatGeneralBreadcrumb;

  beforeEach(() => {
    routerProvider = new StubRouterProvider();
    store = initReduxStore({}, { routerProvider }, {});
    expectSecretariatGeneralBreadcrumb =
      expectSecretariatGeneralBreadcrumbFactory(routerProvider);
  });

  it("should display a breadcrumb", async () => {
    renderNouvelleTransparence(store);
    await expectSecretariatGeneralBreadcrumb();
  });

  it("display a form to create new transparence", async () => {
    renderNouvelleTransparence(store);

    expect(
      await screen.findByLabelText("Nom de la transparence*"),
    ).toBeInTheDocument();
    expect(
      await screen.findByLabelText("Date de la transparence*"),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText("Formation*")).toBeInTheDocument();
    expect(
      screen.getByText(formationToLabel(Magistrat.Formation.SIEGE)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formationToLabel(Magistrat.Formation.PARQUET)),
    ).toBeInTheDocument();
    expect(
      await screen.findByLabelText("Date d'échéance*"),
    ).toBeInTheDocument();
    expect(
      await screen.findByLabelText("Date de prise de poste"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Annuler")).toBeInTheDocument();
    expect(await screen.findByText("Enregistrer")).toBeInTheDocument();
    expect(
      await screen.findByText("Format supporté : xlsx."),
    ).toBeInTheDocument();
    expect(await screen.findByText("Fichier*")).toBeInTheDocument();
  });

  it("should display an error message if the form is invalid", async () => {
    renderNouvelleTransparence(store);

    const saveButton = await screen.findByText("Enregistrer");
    await userEvent.click(saveButton);

    expect(
      await screen.findByText("Le nom de la transparence est requis."),
    ).toBeInTheDocument();

    expect(
      await screen.findByText("La date de la transparence est requise."),
    ).toBeInTheDocument();

    expect(
      await screen.findByText("Un fichier est requis."),
    ).toBeInTheDocument();
  });

  it("should display an error message if the file is not valid", async () => {
    renderNouvelleTransparence(store);
    const fileInput = await screen.findByLabelText(/fichier/i);
    const invalidFile = new File(["test content"], "test.txt", {
      type: "text/plain",
    });

    await userEvent.upload(fileInput, invalidFile);

    const saveButton = screen.getByRole("button", { name: /enregistrer/i });
    await userEvent.click(saveButton);

    expect(
      await screen.findByText("Veuillez importer un fichier au bon format."),
    ).toBeInTheDocument();
  });

  it("should reset all form fields when the user clicks on the cancel button", async () => {
    renderNouvelleTransparence(store);
    const nameInput = await screen.findByLabelText("Nom de la transparence*");
    const dateInput = screen.getByLabelText("Date de la transparence*");
    const formationSelect = screen.getByLabelText("Formation*");
    const dueDateInput = screen.getByLabelText("Date d'échéance*");
    const jobDateInput = screen.getByLabelText("Date de prise de poste");
    const fileInput = screen.getByLabelText(/fichier/i) as HTMLInputElement;

    await userEvent.type(nameInput, "Test Transparence");
    await userEvent.type(dateInput, "2024-03-20");
    await userEvent.selectOptions(formationSelect, "SIEGE");
    await userEvent.type(dueDateInput, "2024-04-20");
    await userEvent.type(jobDateInput, "2024-05-20");

    const file = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });
    await userEvent.upload(fileInput, file);

    // Vérifier que les champs sont remplis
    expect(nameInput).toHaveValue("Test Transparence");
    expect(dateInput).toHaveValue("2024-03-20");
    expect(formationSelect).toHaveValue("SIEGE");
    expect(dueDateInput).toHaveValue("2024-04-20");
    expect(jobDateInput).toHaveValue("2024-05-20");

    // Cliquer sur le bouton Annuler
    const cancelButton = screen.getByRole("button", { name: /annuler/i });
    await userEvent.click(cancelButton);

    // Vérifier que tous les champs sont vides
    expect(nameInput).toHaveValue("");
    expect(dateInput).toHaveValue("");
    expect(formationSelect).toHaveValue("");
    expect(dueDateInput).toHaveValue("");
    expect(jobDateInput).toHaveValue("");
    expect(fileInput.files?.length).toBe(1);
  });
});
