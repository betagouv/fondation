import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/react-redux";
import { selectNominationCaseList } from "../../presenters/selectNominationCaseList";
import { listNominationCase } from "../../../../core-logic/use-cases/nomination-cases-listing/listNominationCase.use-case";
import { NominationCasesTable } from "./NominationCasesTable";

export const NominationCaseList = () => {
  const { nominationCases } = useAppSelector(selectNominationCaseList);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(listNominationCase());
  }, [dispatch]);

  return nominationCases.length ? (
    <NominationCasesTable nominationCases={nominationCases} />
  ) : (
    <div>Aucune nomination.</div>
  );
};
