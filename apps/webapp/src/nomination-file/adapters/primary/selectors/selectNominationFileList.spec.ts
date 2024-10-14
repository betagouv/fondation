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
    .withTitle("Lucien Denan")
    .withDueDate(new DateOnly(2030, 10, 30))
    .build();
  const aNominationFileVM: NominationFileListItemVM = {
    id: "nomination-file-id",
    title: "Lucien Denan",
    dueDate: "30/10/2030",
    href: "/dossier-de-nomination/nomination-file-id",
    onClick,
  };

  const anotherNominationFile = new NominationFileBuilder()
    .withId("another-nomination-file-id")
    .withTitle("Another name")
    .withDueDate(new DateOnly(2030, 10, 10))
    .build();
  const anotherNominationFileVM: NominationFileListItemVM = {
    id: "another-nomination-file-id",
    title: "Another name",
    dueDate: "10/10/2030",
    href: "/dossier-de-nomination/another-nomination-file-id",
    onClick,
  };
});
