import { NominationCaseBuilder } from "../../../core-logic/builders/nominationCase.builder";
import { listNominationCase } from "../../../core-logic/use-cases/nomination-cases-listing/listNominationCase.use-case";
import { initReduxStore, ReduxStore } from "../../../store/reduxStore";
import {
  NominationCaseListItemVM,
  NominationCaseListVM,
  selectNominationCaseList,
} from "./selectNominationCaseList";

describe("Select Nomination Case List", () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore();
  });

  it("shows an empty list", () => {
    expect(
      selectNominationCaseList(store.getState())
    ).toEqual<NominationCaseListVM>({
      nominationCases: [],
    });
  });

  describe("when there are two nomination cases", () => {
    beforeEach(() => {
      store.dispatch(
        listNominationCase.fulfilled(
          [aNominationCase, anotherNominationCase],
          "",
          undefined
        )
      );
    });

    it("selects the list", () => {
      expect(
        selectNominationCaseList(store.getState())
      ).toEqual<NominationCaseListVM>({
        nominationCases: [aNominationCaseVM, anotherNominationCaseVM],
      });
    });
  });
});

const aNominationCase = new NominationCaseBuilder()
  .withId("nomination-case-id")
  .withName("Lucien Denan")
  .build();
const aNominationCaseVM: NominationCaseListItemVM = {
  id: "nomination-case-id",
  name: "Lucien Denan",
};

const anotherNominationCase = new NominationCaseBuilder()
  .withId("another-nomination-case-id")
  .withName("Another name")
  .build();
const anotherNominationCaseVM: NominationCaseListItemVM = {
  id: "another-nomination-case-id",
  name: "Another name",
};
