import { NominationCaseBuilder } from "../../../core-logic/builders/nominationCase.builder";
import { retrieveNominationCase } from "../../../core-logic/use-cases/nomination-case-retrieval/retrieveNominationCase.use-case";
import { ReduxStore, initReduxStore } from "../../../store/reduxStore";
import { NominationCaseVM, selectNominationCase } from "./selectNominationCase";

describe("Select Nomination Case", () => {
  let store: ReduxStore;

  beforeEach(() => {
    store = initReduxStore();
    store.dispatch(retrieveNominationCase.fulfilled(aNominationCase, "", ""));
  });

  it("select a nomination case", async () => {
    expect(
      selectNominationCase(store.getState(), "nomination-case-id")
    ).toEqual(aNominationCaseVM);
  });
});

const aNominationCase = new NominationCaseBuilder()
  .withId("nomination-case-id")
  .withName("John Doe")
  .withBiography("The biography.")
  .withTransferTimeValidated(true)
  .withGettingFirstGradeValidated(true)
  .withGettingGradeHHValidated(true)
  .withGettingGradeInPlaceValidated(true)
  .withProfiledPositionValidated(true)
  .withCassationCourtNominationValidated(true)
  .withOverseasToOverseasValidated(true)
  .withJudiciaryRoleAndJuridictionDegreeChangeValidated(true)
  .withJudiciaryRoleAndJuridictionDegreeChangeInSameRessortValidated(true)
  .build();
const aNominationCaseVM: NominationCaseVM = {
  id: "nomination-case-id",
  name: "John Doe",
  biography: "The biography.",
  rulesChecked: {
    management: {
      transferTime: false,
      gettingFirstGrade: false,
      gettingGradeHH: false,
      gettingGradeInPlace: false,
      profiledPosition: false,
      cassationCourtNomination: false,
      overseasToOverseas: false,
      judiciaryRoleAndJuridictionDegreeChange: false,
      judiciaryRoleAndJuridictionDegreeChangeInSameRessort: false,
    },
  },
};
