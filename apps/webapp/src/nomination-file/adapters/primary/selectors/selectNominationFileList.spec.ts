import { FakeAuthenticationGateway } from "../../../../authentication/adapters/secondary/gateways/fakeAuthentication.gateway";
import { AuthenticatedUser } from "../../../../authentication/core-logic/gateways/authentication.gateway";
import { authenticate } from "../../../../authentication/core-logic/use-cases/authentication/authenticate";
import { StubRouterProvider } from "../../../../router/adapters/stubRouterProvider";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { NominationFileBuilder } from "../../../core-logic/builders/NominationFile.builder";
import { listNominationFile } from "../../../core-logic/use-cases/nomination-file-listing/listNominationFile.use-case";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import {
  NominationFileListItemVM,
  NominationFileListVM,
  selectNominationFileList,
} from "./selectNominationFileList";

describe("Select Nomination Case List", () => {
  let store: ReduxStore;
  let authenticationGateway: FakeAuthenticationGateway;
  const onClick = () => null;

  beforeEach(() => {
    authenticationGateway = new FakeAuthenticationGateway();
    authenticationGateway.setEligibleAuthUser(user.email, user.password, {
      reporterName: user.reporterName,
    });

    const stubRouterProvider = new StubRouterProvider();
    stubRouterProvider.onClickAttribute = onClick;
    store = initReduxStore(
      {},
      {
        routerProvider: stubRouterProvider,
      },
      {},
    );
  });

  it("shows an empty list", () => {
    expect(
      selectNominationFileList(store.getState()),
    ).toEqual<NominationFileListVM>({
      nominationFiles: [],
    });
  });

  describe("when there are three nomination cases", () => {
    beforeEach(() => {
      store.dispatch(
        authenticate.fulfilled(user, "", {
          email: user.email,
          password: user.password,
        }),
      );
      store.dispatch(
        listNominationFile.fulfilled(
          [
            aNominationFile,
            aSecondNominationFile,
            aThirdNominationFile,
            anotherUserNominationFile,
          ],
          "",
          undefined,
        ),
      );
    });

    it("selects the sorted list by folder number for the auth user", () => {
      expect(
        selectNominationFileList(store.getState()),
      ).toEqual<NominationFileListVM>({
        nominationFiles: [
          aNominationFileVM,
          aThirdNominationFileVM,
          aSecondNominationFileVM,
        ],
      });
    });
  });

  const aNominationFile = new NominationFileBuilder()
    .with("id", "nomination-file-id")
    .with("folderNumber", 1)
    .with("name", "Banneau Louise")
    .with("reporterName", user.reporterName)
    .with("dueDate", new DateOnly(2030, 10, 30))
    .buildListVM();
  const aNominationFileVM: NominationFileListItemVM = {
    id: aNominationFile.id,
    folderNumber: 1,
    name: aNominationFile.name,
    reporterName: aNominationFile.reporterName,
    dueDate: "30/10/2030",
    state: "Nouveau",
    formation: "Parquet",
    transparency: "Mars 2025",
    grade: "I",
    targettedPosition: "PG TJ Marseille",
    observersCount: aNominationFile.observersCount,
    href: `/dossier-de-nomination/${aNominationFile.id}`,
    onClick,
  };

  const aSecondNominationFile = new NominationFileBuilder()
    .with("id", "nomination-file-id")
    .with("folderNumber", null)
    .with("name", "Denan Lucien")
    .with("reporterName", user.reporterName)
    .with("dueDate", new DateOnly(2030, 10, 30))
    .buildListVM();
  const aSecondNominationFileVM: NominationFileListItemVM = {
    id: aSecondNominationFile.id,
    folderNumber: "Profilé",
    name: aSecondNominationFile.name,
    reporterName: aSecondNominationFile.reporterName,
    dueDate: "30/10/2030",
    state: "Nouveau",
    formation: "Parquet",
    transparency: "Mars 2025",
    grade: "I",
    targettedPosition: "PG TJ Marseille",
    observersCount: aNominationFile.observersCount,
    href: `/dossier-de-nomination/${aSecondNominationFile.id}`,
    onClick,
  };

  const aThirdNominationFile = new NominationFileBuilder()
    .with("folderNumber", 2)
    .buildListVM();
  const aThirdNominationFileVM: NominationFileListItemVM = {
    id: aThirdNominationFile.id,
    folderNumber: 2,
    name: aThirdNominationFile.name,
    reporterName: aThirdNominationFile.reporterName,
    dueDate: "30/10/2030",
    state: "Nouveau",
    formation: "Parquet",
    transparency: "Mars 2025",
    grade: "I",
    targettedPosition: "PG TJ Marseille",
    observersCount: aNominationFile.observersCount,
    href: `/dossier-de-nomination/${aThirdNominationFile.id}`,
    onClick,
  };

  const anotherUserNominationFile = new NominationFileBuilder()
    .with("id", "another-nomination-file-id")
    .with("name", "Another name")
    .with("reporterName", "ANOTHER REPORTER Name")
    .with("dueDate", new DateOnly(2030, 10, 10))
    .buildListVM();
});

const user = {
  email: "username@example.fr",
  password: "password",
  reporterName: "REPORTER Name",
} satisfies AuthenticatedUser & { email: string; password: string };
