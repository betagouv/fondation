import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/react-redux";
import { selectNominationCase } from "../presenters/selectNominationCase";
import { retrieveNominationCase } from "../../../core-logic/use-cases/nomination-case-retrieval/retrieveNominationCase.use-case";
import { NominationRule } from "./NominationRule";

export type NominationCaseOverviewProps = {
  id: string;
};

export const NominationCaseOverview: React.FC<NominationCaseOverviewProps> = ({
  id,
}) => {
  const nominationCase = useAppSelector((state) =>
    selectNominationCase(state, id)
  );
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(retrieveNominationCase(id));
  }, [dispatch, id]);

  if (!nominationCase) return <div>Nomination case not found</div>;
  return (
    <div>
      <h1>{nominationCase.name}</h1>
      <p>{nominationCase.biography}</p>
      <div>
        <NominationRule
          checked={nominationCase.rulesChecked.management.transferTime}
          label="Transfer time"
        />
        <NominationRule
          checked={nominationCase.rulesChecked.management.gettingFirstGrade}
          label="Getting first grade"
        />
        <NominationRule
          checked={nominationCase.rulesChecked.management.gettingGradeHH}
          label="Getting grade HH"
        />
        <NominationRule
          checked={nominationCase.rulesChecked.management.gettingGradeInPlace}
          label="Getting grade in place"
        />
        <NominationRule
          checked={nominationCase.rulesChecked.management.profiledPosition}
          label="Profiled position"
        />
        <NominationRule
          checked={
            nominationCase.rulesChecked.management.cassationCourtNomination
          }
          label="Cassation court nomination"
        />
        <NominationRule
          checked={nominationCase.rulesChecked.management.overseasToOverseas}
          label="Overseas to overseas"
        />
        <NominationRule
          checked={
            nominationCase.rulesChecked.management
              .judiciaryRoleAndJuridictionDegreeChange
          }
          label="Judiciary role and jurisdiction degree change"
        />
        <NominationRule
          checked={
            nominationCase.rulesChecked.management
              .judiciaryRoleAndJuridictionDegreeChangeInSameRessort
          }
          label="Judiciary role and jurisdiction degree change in same ressort"
        />
      </div>
    </div>
  );
};
