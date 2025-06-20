import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import {
  DateOnlyJson,
  Gender,
  Magistrat,
  NominationFile,
  Role,
  Transparency,
} from "shared-models";
import { ApiAuthenticationGateway } from "../../../../../authentication/adapters/secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../../../../authentication/adapters/secondary/gateways/FakeAuthentication.client";
import { StubLoginNotifierProvider } from "../../../../../authentication/adapters/secondary/providers/stubLoginNotifier.provider";
import { AuthenticatedUserSM } from "../../../../../authentication/core-logic/gateways/Authentication.gateway";
import {
  AuthenticateParams,
  authenticate,
} from "../../../../../authentication/core-logic/use-cases/authentication/authenticate";
import { StubRouterProvider } from "../../../../../router/adapters/stubRouterProvider";
import { ReduxStore, initReduxStore } from "../../../../../store/reduxStore";
import { ReportApiModelBuilder } from "../../../../core-logic/builders/ReportApiModel.builder";
import { ApiReportGateway } from "../../../secondary/gateways/ApiReport.gateway";
import { FakeReportApiClient } from "../../../secondary/gateways/FakeReport.client";
import {
  formationToLabel,
  transparencyToLabel,
} from "../../labels/labels-mappers";
import { Transparencies } from "./Transparencies";

const gdsTitle = "Pouvoir de proposition du GDS";

describe("Transparencies Component", () => {
  let store: ReduxStore;
  let routerProvider: StubRouterProvider;
  let reportApiClient: FakeReportApiClient;
  const user: AuthenticatedUserSM = {
    firstName: "John",
    lastName: "Doe",
    role: Role.MEMBRE_COMMUN,
    gender: Gender.M,
  };
  const userCredentials: AuthenticateParams = {
    email: "username",
    password: "password",
  };

  const apiClient = new FakeAuthenticationApiClient();
  apiClient.setEligibleAuthUser(
    userCredentials.email,
    userCredentials.password,
    user.firstName,
    user.lastName,
    user.role,
    user.gender,
  );

  const authenticationGateway = new ApiAuthenticationGateway(apiClient);
  const loginNotifierProvider = new StubLoginNotifierProvider();

  beforeEach(async () => {
    routerProvider = new StubRouterProvider();
    routerProvider.onTransparencyClickAttribute = vi.fn();

    reportApiClient = new FakeReportApiClient();
    const reportGateway = new ApiReportGateway(reportApiClient);

    store = initReduxStore(
      { reportGateway, authenticationGateway },
      { routerProvider, loginNotifierProvider },
      {},
    );
  });

  it("shows the introduction", async () => {
    await store.dispatch(authenticate(userCredentials));
    renderTransparencies();
    const heading = await screen.findByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Bonjour, Monsieur DOE.");
    await screen.findByText(
      "Sur quel type de saisine souhaitez-vous travailler ?",
    );
  });

  it("shows the 'Pouvoir de proposition du Garde des sceaux' heading", async () => {
    renderTransparencies();
    await screen.findByText(gdsTitle);
  });

  it("shows no transparencies message", async () => {
    renderTransparencies();
    await screen.findByText("Il n'y a pas de transparences actives.");
    expect(
      screen.getByText("Sur quel type de saisine souhaitez-vous travailler ?"),
    ).not.toBeVisible();
    expect(screen.getByText(gdsTitle)).toBeVisible();
  });

  describe("GDS transparencies", () => {
    describe.each`
      description                  | transparency                               | formation                      | invisibleFormation
      ${"reports for the parquet"} | ${Transparency.PARQUET_DU_06_FEVRIER_2025} | ${Magistrat.Formation.PARQUET} | ${Magistrat.Formation.SIEGE}
      ${"reports for the siège"}   | ${Transparency.SIEGE_DU_06_FEVRIER_2025}   | ${Magistrat.Formation.SIEGE}   | ${Magistrat.Formation.PARQUET}
    `(
      "Given $description",
      ({ transparency, formation, invisibleFormation }) => {
        const aReport = new ReportApiModelBuilder()
          .with("state", NominationFile.ReportState.IN_PROGRESS)
          .with("formation", formation)
          .with("transparency", transparency)
          .build();

        beforeEach(() => {
          reportApiClient.reports = {};
          reportApiClient.addReports(aReport);
        });

        it("shows the GDS title", async () => {
          renderTransparencies();
          await screen.findByText(gdsTitle);
        });

        it("shows the formation", async () => {
          renderTransparencies();

          await findFormationTab(formation);
          expect(
            screen.queryByText(formationToLabel(invisibleFormation)),
          ).toBeNull();
        });

        it("shows the transparency", async () => {
          renderTransparencies();
          await findTransparencyLabel(
            aReport.transparency,
            aReport.dateTransparence,
          );
        });
      },
    );

    describe("Tabs", () => {
      it("when there is only one tab, it has an icon on it", async () => {
        reportApiClient.addReports(givenAParquetTab());

        renderTransparencies();

        const parquetTab = await findFormationTab(Magistrat.Formation.PARQUET);
        expect(parquetTab).toHaveClass("fr-icon-arrow-right-line");
      });

      it("when there is two tabs, it has an icon on the default one", async () => {
        reportApiClient.addReports(givenASiegeTab(), givenAParquetTab());

        renderTransparencies();

        const tab = await findFormationTab(Magistrat.Formation.SIEGE);
        const parquetTab = await findFormationTab(Magistrat.Formation.PARQUET);
        expect(tab).toHaveClass("fr-icon-arrow-right-line");
        expect(parquetTab).not.toHaveClass("fr-icon-arrow-right-line");
      });

      it("when there is two tabs, it changes the active one on click", async () => {
        const parquetReport = givenAParquetTab();
        reportApiClient.addReports(givenASiegeTab(), parquetReport);
        renderTransparencies();

        const tab = await findFormationTab(Magistrat.Formation.SIEGE);
        const parquetTab = await findFormationTab(Magistrat.Formation.PARQUET);

        await userEvent.click(parquetTab);

        expect(tab).not.toHaveClass("fr-icon-arrow-right-line");
        expect(parquetTab).toHaveClass("fr-icon-arrow-right-line");
        await findTransparencyLabel(
          parquetReport.transparency,
          parquetReport.dateTransparence,
        );
      });

      const givenASiegeTab = () =>
        new ReportApiModelBuilder()
          .with("state", NominationFile.ReportState.IN_PROGRESS)
          .with("formation", Magistrat.Formation.SIEGE)
          .with("transparency", Transparency.SIEGE_DU_06_FEVRIER_2025)
          .build();
      const givenAParquetTab = () =>
        new ReportApiModelBuilder()
          .with("id", "parquet-report-id")
          .with("state", NominationFile.ReportState.IN_PROGRESS)
          .with("formation", Magistrat.Formation.PARQUET)
          .with("transparency", Transparency.PARQUET_DU_06_FEVRIER_2025)
          .build();
    });

    it("clicks on a transparency then go to the reports list", async () => {
      const aReport = new ReportApiModelBuilder()
        .with("state", NominationFile.ReportState.IN_PROGRESS)
        .with("transparency", Transparency.PARQUET_DU_06_FEVRIER_2025)
        .build();
      reportApiClient.reports = {};
      reportApiClient.addReports(aReport);

      renderTransparencies();

      const transparencyLabel = await findTransparencyLabel(
        aReport.transparency,
        aReport.dateTransparence,
      );
      await userEvent.click(transparencyLabel);

      expect(routerProvider.onTransparencyClickAttribute).toHaveBeenCalledWith(
        aReport.transparency,
      );
    });

    it("always shows the CSM title", async () => {
      renderTransparencies();
      await screen.findByText("Pouvoir de proposition du CSM");
      screen.getByText("En cours de construction.");
    });
  });

  const findFormationTab = (formation: Magistrat.Formation) =>
    screen.findByText(formationToLabel(formation));

  const findTransparencyLabel = (
    transparency: Transparency,
    dateTransparence: DateOnlyJson,
  ) => screen.findByText(transparencyToLabel(transparency, dateTransparence));

  const renderTransparencies = () => {
    render(
      <Provider store={store}>
        <Transparencies />
      </Provider>,
    );
  };
});
