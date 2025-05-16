import { render, screen } from "@testing-library/react";

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

  it("should render", () => {
    renderNouvelleTransparence(store);
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
      await screen.getByText(formationToLabel(Magistrat.Formation.SIEGE)),
    ).toBeInTheDocument();
    expect(
      await screen.getByText(formationToLabel(Magistrat.Formation.PARQUET)),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText("Date d'échéance")).toBeInTheDocument();
    expect(
      await screen.findByLabelText("Date de la prise de poste"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Annuler")).toBeInTheDocument();
    expect(await screen.findByText("Enregistrer")).toBeInTheDocument();
    expect(
      await screen.findByText("Formats supportés : png, jpeg et pdf."),
    ).toBeInTheDocument();
    expect(await screen.findByText("Fichier*")).toBeInTheDocument();
  });

  // TODO CREATE A TEST FOR THE VALIDATION FORM
});
