import { FakeAuthenticationGateway } from "../../../../authentication/adapters/secondary/gateways/fakeAuthentication.gateway";
import { AuthenticatedUser } from "../../../../authentication/core-logic/gateways/authentication.gateway";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { FakeNominationFileGateway } from "../../../adapters/secondary/gateways/FakeNominationFile.gateway";
import { AppState } from "../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { NominationFileBuilder } from "../../builders/NominationFile.builder";
import { listNominationFile } from "./listNominationFile.use-case";

describe("Nomination Files Listing", () => {
  let store: ReduxStore;
  let nominationFileGateway: FakeNominationFileGateway;
  let initialState: AppState;
  let authenticationGateway: FakeAuthenticationGateway;

  beforeEach(() => {
    nominationFileGateway = new FakeNominationFileGateway();
    authenticationGateway = new FakeAuthenticationGateway();
    store = initReduxStore(
      {
        nominationFileGateway,
        authenticationGateway,
      },
      {},
      {},
    );
    initialState = store.getState();
  });

  describe("when there is a report", () => {
    beforeEach(() => {
      nominationFileGateway.addNominationFile(aNominationFile);
    });

    it("doesn't show reports if there is no user authenticated", async () => {
      await store.dispatch(listNominationFile());
      expect(store.getState()).toBe<AppState>(initialState);
    });

    describe("Authenticated user", () => {
      beforeEach(() => {
        authenticationGateway.setEligibleAuthUser(
          "user@example.fr",
          "password",
          true,
          { reporterName: "REPORTER Name" },
        );
      });

      it("lists the report", async () => {
        await store.dispatch(listNominationFile());
        expect(store.getState()).toEqual<AppState>({
          ...initialState,
          nominationCaseList: {
            data: [
              {
                id: aNominationFile.id,
                name: aNominationFile.name,
                reporterName: user.reporterName,
                dueDate: aNominationFile.dueDate,
                state: aNominationFile.state,
                formation: aNominationFile.formation,
                transparency: aNominationFile.transparency,
                grade: aNominationFile.grade,
                targettedPosition: aNominationFile.targettedPosition,
              },
            ],
          },
        });
      });

      describe("when there is another report", () => {
        beforeEach(() => {
          nominationFileGateway.addNominationFile(anotherUserNominationFile);
        });

        it("shows only the report of the authenticated user", async () => {
          await store.dispatch(listNominationFile());
          expect(store.getState()).toEqual<AppState>({
            ...initialState,
            nominationCaseList: {
              data: [
                {
                  id: aNominationFile.id,
                  name: aNominationFile.name,
                  reporterName: user.reporterName,
                  dueDate: aNominationFile.dueDate,
                  state: aNominationFile.state,
                  formation: aNominationFile.formation,
                  transparency: aNominationFile.transparency,
                  grade: aNominationFile.grade,
                  targettedPosition: aNominationFile.targettedPosition,
                },
              ],
            },
          });
        });
      });
    });
  });
});

const user: AuthenticatedUser = {
  reporterName: "REPORTER Name",
};

const aNominationFile = new NominationFileBuilder()
  .withId("user-nomination-file-id")
  .withName("Lucien Denan")
  .withReporterName(user.reporterName)
  .withDueDate(new DateOnly(2030, 10, 30))
  .build();
const anotherUserNominationFile = new NominationFileBuilder()
  .withId("another-nomination-file-id")
  .withReporterName("SOMEONE Else")
  .build();
