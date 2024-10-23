import { NominationFile } from "shared-models";
import { FakeNominationFileGateway } from "../../../adapters/secondary/gateways/FakeNominationFile.gateway";
import { AppState, NominationFileSM } from "../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { NominationFileBuilder } from "../../builders/NominationFile.builder";
import { retrieveNominationFile } from "../nomination-file-retrieval/retrieveNominationFile.use-case";
import {
  updateNominationFile,
  UpdateNominationFileParams,
} from "./updateNominationFile.use-case";

describe("Nomination File Update", () => {
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

  const testData: UpdateNominationFileParams["data"][] = [
    {
      state: NominationFile.ReportState.READY_TO_SUPPORT,
    },
    {
      biography: "new biography",
    },
    {
      comment: "new comment",
    },
    {
      state: NominationFile.ReportState.IN_PROGRESS,
      biography: "new biography",
      comment: "new comment",
    },
  ];
  it.each(testData)("updates with this new data: %s", async (newData) => {
    nominationCaseGateway.addNominationFile(aNomination);
    store.dispatch(retrieveNominationFile.fulfilled(aNomination, "", ""));

    await store.dispatch(
      updateNominationFile({
        reportId: "nomination-file-id",
        data: newData,
      }),
    );
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      nominationFileOverview: {
        byIds: {
          [aNomination.id]: {
            ...aNomination,
            ...newData,
          },
        },
      },
    });
  });
});

const aNomination: NominationFileSM = new NominationFileBuilder()
  .withTransferTimeValidated(false)
  .withState(NominationFile.ReportState.NEW)
  .withBiography("John Doe's biography")
  .withComment("Some comment")
  .build();
