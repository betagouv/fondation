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
  const onClick = () => null;

  beforeEach(() => {
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
        listNominationFile.fulfilled(
          [aNominationFile, anotherNominationFile],
          "",
          undefined,
        ),
      );
    });

    it("selects the list", () => {
      expect(
        selectNominationFileList(store.getState()),
      ).toEqual<NominationFileListVM>({
        nominationFiles: [aNominationFileVM, anotherNominationFileVM],
      });
    });
  });

  const aNominationFile = new NominationFileBuilder()
    .withId("nomination-file-id")
    .withName("Lucien Denan")
    .withDueDate(new DateOnly(2030, 10, 30))
    .build();
  const aNominationFileVM: NominationFileListItemVM = {
    id: aNominationFile.id,
    name: aNominationFile.name,
    reporterName: aNominationFile.reporterName,
    dueDate: "30/10/2030",
    state: "Nouveau",
    formation: "Parquet",
    transparency: "transparence de mars 2025",
    grade: "I",
    targettedPosition: "PG TJ Marseille",
    href: `/dossier-de-nomination/${aNominationFile.id}`,
    onClick,
  };

  const anotherNominationFile = new NominationFileBuilder()
    .withId("another-nomination-file-id")
    .withName("Another name")
    .withReporterName("ANOTHER REPORTER Name")
    .withDueDate(new DateOnly(2030, 10, 10))
    .build();
  const anotherNominationFileVM: NominationFileListItemVM = {
    id: anotherNominationFile.id,
    name: anotherNominationFile.name,
    reporterName: anotherNominationFile.reporterName,
    dueDate: "10/10/2030",
    state: "Nouveau",
    formation: "Parquet",
    transparency: "transparence de mars 2025",
    grade: "I",
    targettedPosition: "PG TJ Marseille",

    href: `/dossier-de-nomination/${anotherNominationFile.id}`,
    onClick,
  };
});
