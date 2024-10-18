import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { FakeNominationFileGateway } from "../../../adapters/secondary/gateways/FakeNominationFile.gateway";
import { AppState } from "../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { NominationFileBuilder } from "../../builders/NominationFile.builder";
import { listNominationFile } from "./listNominationFile.use-case";

describe("Nomination Files Listing", () => {
  let store: ReduxStore;
  let nominationCaseGateway: FakeNominationFileGateway;
  let initialState: AppState;

  beforeEach(() => {
    nominationCaseGateway = new FakeNominationFileGateway();
    store = initReduxStore(
      {
        nominationFileGateway: nominationCaseGateway,
      },
      {},
      {},
    );
    initialState = store.getState();
  });

  it("lists a nomination file", async () => {
    const nominationFileSM = new NominationFileBuilder()
      .withId("nomination-file-id")
      .withTitle("Lucien Denan")
      .withDueDate(new DateOnly(2030, 10, 30))
      .build();
    nominationCaseGateway.addNominationFile(nominationFileSM);

    await store.dispatch(listNominationFile());

    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      nominationCaseList: {
        data: [
          {
            id: nominationFileSM.id,
            name: nominationFileSM.name,
            dueDate: nominationFileSM.dueDate,
            state: nominationFileSM.state,
            formation: nominationFileSM.formation,
            transparency: nominationFileSM.transparency,
            grade: nominationFileSM.grade,
            targettedPosition: nominationFileSM.targettedPosition,
          },
        ],
      },
    });
  });
});
