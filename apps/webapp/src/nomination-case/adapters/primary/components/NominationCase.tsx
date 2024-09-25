import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/react-redux";
import { selectNominationCase } from "../presenters/selectNominationCase";
import { retrieveNominationCase } from "../../../core-logic/use-cases/nomination-case-retrieval/retrieveNominationCase.use-case";

export type NominationCaseProps = {
  id: string;
};

export const NominationCase: React.FC<NominationCaseProps> = ({ id }) => {
  const nominationCase = useAppSelector((state) =>
    selectNominationCase(state, id)
  );
  console.log("nominationCase", nominationCase);
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
        <div
          role="checkbox"
          aria-checked={nominationCase.rulesChecked.overseasToOverseas}
        >
          Overseas to overseas
        </div>
      </div>
    </div>
  );
};
