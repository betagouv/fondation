import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { StubRouterProvider } from "../../../../router/adapters/stubRouterProvider";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import {
  ExpectSecretariatGeneralBreadcrumb,
  expectSecretariatGeneralBreadcrumbFactory,
} from "../../../../test/breadcrumb";
import Dashboard from "./Dashboard";

const renderSgDashboard = (store: ReduxStore) => {
  render(
    <Provider store={store}>
      <Dashboard />
    </Provider>,
  );
};

describe("Dashboard component", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;
  let expectSecretariatGeneralBreadcrumb: ExpectSecretariatGeneralBreadcrumb;

  beforeEach(() => {
    routerProvider = new StubRouterProvider();
    store = initReduxStore({}, { routerProvider }, {});
    expectSecretariatGeneralBreadcrumb =
      expectSecretariatGeneralBreadcrumbFactory(routerProvider);
  });

  describe("Breadcrumb", () => {
    it("should display a breadcrumb", async () => {
      renderSgDashboard(store);
      await expectSecretariatGeneralBreadcrumb();
    });
  });

  it("should display the title", async () => {
    renderSgDashboard(store);

    const heading = await screen.findByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Tableau de bord");
  });

  describe("Card content", () => {
    it("should display the card title", async () => {
      renderSgDashboard(store);

      const cardTitle = await screen.findByRole("heading", {
        level: 3,
        name: "Créer une nouvelle transparence",
      });
      expect(cardTitle).toBeInTheDocument();
    });

    it("should display the card description", async () => {
      renderSgDashboard(store);

      const cardDescription = await screen.findByText(
        "Renseignez les premières informations à votre disposition concernant une nouvelle transparence.",
      );
      expect(cardDescription).toBeInTheDocument();
    });
  });
});
