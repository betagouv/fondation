import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { ReportBuilder } from "../../../../core-logic/builders/Report.builder";
import { listReport } from "../../../../core-logic/use-cases/report-listing/listReport.use-case";
import { Transparencies } from "./Transparencies";
import { ReduxStore, initReduxStore } from "../../../../../store/reduxStore";
import { Magistrat, NominationFile, Transparency } from "shared-models";
import {
  formationToLabel,
  transparencyToLabel,
} from "../../labels/labels-mappers";

describe("Transparencies Component", () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore({}, {}, {});
  });

  it("shows the introduction", async () => {
    renderTransparencies();
    await screen.findByText("Bonjour,");
    await screen.findByText(
      "Sur quel type de saisine souhaitez-vous travailler ?",
    );
  });

  it("shows the 'Pouvoir de proposition du Garde des sceaux' heading", async () => {
    renderTransparencies();
    await screen.findByText("Pouvoir de proposition du garde des Sceaux");
  });

  it("shows no transparencies message", async () => {
    renderTransparencies();
    await screen.findByText("Il n'y a pas de transparences actives.");
    expect(
      screen.getByText("Sur quel type de saisine souhaitez-vous travailler ?"),
    ).not.toBeVisible();
    expect(
      screen.getByText("Pouvoir de proposition du garde des Sceaux"),
    ).not.toBeVisible();
  });

  describe("GDS transparencies", () => {
    describe.each`
      description                  | transparency                               | formation                      | invisibleFormation
      ${"reports for the parquet"} | ${Transparency.PARQUET_DU_06_FEVRIER_2025} | ${Magistrat.Formation.PARQUET} | ${Magistrat.Formation.SIEGE}
      ${"reports for the siège"}   | ${Transparency.SIEGE_DU_06_FEVRIER_2025}   | ${Magistrat.Formation.SIEGE}   | ${Magistrat.Formation.PARQUET}
    `(
      "Given $description",
      ({ transparency, formation, invisibleFormation }) => {
        const aReport = new ReportBuilder()
          .with("state", NominationFile.ReportState.IN_PROGRESS)
          .with("formation", formation)
          .with("transparency", transparency)
          .buildListSM();

        beforeEach(() => {
          store.dispatch(listReport.fulfilled([aReport], "", undefined));
        });

        it("shows the GDS title", () => {
          renderTransparencies();
          screen.getByText("Pouvoir de proposition du garde des Sceaux");
        });

        it("shows the formation", () => {
          renderTransparencies();

          screen.getByText(formationToLabel(formation));
          expect(
            screen.queryByText(formationToLabel(invisibleFormation)),
          ).toBeNull();
        });

        it("shows the transparency", () => {
          renderTransparencies();
          screen.getByText(transparencyToLabel(aReport.transparency));
        });
      },
    );

    it("always shows the CSM title", () => {
      renderTransparencies();
      screen.getByText("Pouvoir de proposition du CSM");
      screen.getByText("En cours de construction");
    });
  });

  const renderTransparencies = () => {
    render(
      <Provider store={store}>
        <Transparencies />
      </Provider>,
    );
  };
});
