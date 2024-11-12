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

  describe("when there are two nomination cases", () => {
    beforeEach(() => {
      store.dispatch(
        authenticate.fulfilled(user, "", {
          email: user.email,
          password: user.password,
        }),
      );
      store.dispatch(
        listNominationFile.fulfilled(
          [anotherNominationFile, aNominationFile, anotherUserNominationFile],
          "",
          undefined,
        ),
      );
    });

    it("selects the sorted list for the auth user", () => {
      expect(
        selectNominationFileList(store.getState()),
      ).toEqual<NominationFileListVM>({
        nominationFiles: [aNominationFileVM, anotherNominationFileVM],
      });
    });
  });

  const aNominationFile = new NominationFileBuilder()
    .with("id", "nomination-file-id")
    .with("name", "Banneau Louise")
    .with("reporterName", user.reporterName)
    .with("dueDate", new DateOnly(2030, 10, 30))
    .buildListVM();
  const aNominationFileVM: NominationFileListItemVM = {
    id: aNominationFile.id,
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

  const anotherNominationFile = new NominationFileBuilder()
    .with("id", "nomination-file-id")
    .with("name", "Denan Lucien")
    .with("reporterName", user.reporterName)
    .with("dueDate", new DateOnly(2030, 10, 30))
    .buildListVM();
  const anotherNominationFileVM: NominationFileListItemVM = {
    id: anotherNominationFile.id,
    name: anotherNominationFile.name,
    reporterName: anotherNominationFile.reporterName,
    dueDate: "30/10/2030",
    state: "Nouveau",
    formation: "Parquet",
    transparency: "Mars 2025",
    grade: "I",
    targettedPosition: "PG TJ Marseille",
    observersCount: aNominationFile.observersCount,
    href: `/dossier-de-nomination/${anotherNominationFile.id}`,
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
