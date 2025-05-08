import { StubRouterProvider } from "../../../../router/adapters/stubRouterProvider";
import { BreadcrumbVM } from "../../../../shared-kernel/core-logic/models/breadcrumb-vm";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { BreadcrumCurrentPage, selectBreadcrumb } from "./selectBreadcrumb";
describe("Breadcrumb", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;
  let breadcrumb: ReturnType<typeof selectBreadcrumb>;

  beforeEach(() => {
    routerProvider = new StubRouterProvider();
    store = initReduxStore(
      {},
      {
        routerProvider,
      },
      {},
    );
  });

  describe("secretariat general", () => {
    const sgBaseSegments = [
      {
        label: "Secretariat général",
        href: "/secretariat-general",
        onClick: expect.any(Function),
      },
    ];

    it("should show a valid breadcrumb when on the secretariat general page", async () => {
      const selectSecretariatGeneralBreadcrumb = () => {
        breadcrumb = selectBreadcrumb(store.getState(), {
          name: BreadcrumCurrentPage.secretariatGeneral,
        });
      };
      selectSecretariatGeneralBreadcrumb();
      expectBreadcrumb({
        currentPageLabel: "Tableau de bord",
        segments: sgBaseSegments,
      });
    });

    it("should show a valid breadcrumb when on the secretariat nouvelle transparence page", async () => {
      const selectSgNouvelleTransparenceBreadcrumb = () => {
        breadcrumb = selectBreadcrumb(store.getState(), {
          name: BreadcrumCurrentPage.sgNouvelleTransparence,
        });
      };
      selectSgNouvelleTransparenceBreadcrumb();
      expectBreadcrumb({
        currentPageLabel: "Créer une nouvelle transparence",
        segments: [
          ...sgBaseSegments,
          {
            label: "Tableau de bord",
            href: "/secretariat-general",
            onClick: expect.any(Function),
          },
        ],
      });
    });
  });

  const expectBreadcrumb = (expectedBreadcrumb: BreadcrumbVM) =>
    expect(breadcrumb).toEqual(expectedBreadcrumb);
});
