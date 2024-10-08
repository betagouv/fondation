import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/react-redux";
import { selectNominationFileList } from "../../selectors/selectNominationFileList";
import { listNominationFile } from "../../../../core-logic/use-cases/nomination-file-listing/listNominationFile.use-case";
import { NominationFilesTable } from "./NominationFilesTable";

export const NominationFileList = () => {
  const { nominationFiles } = useAppSelector(selectNominationFileList);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(listNominationFile());
  }, [dispatch]);

  return nominationFiles.length ? (
    <NominationFilesTable nominationFiles={nominationFiles} />
  ) : (
    <div>Aucune nomination.</div>
  );
};
export default NominationFileList;
