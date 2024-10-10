import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/react-redux";
import { selectNominationFileList } from "../../selectors/selectNominationFileList";
import { listNominationFile } from "../../../../core-logic/use-cases/nomination-file-listing/listNominationFile.use-case";
import { NominationFilesTable } from "./NominationFilesTable";
import { cx } from "@codegouvfr/react-dsfr/fr/cx";

export const NominationFileList = () => {
  const { nominationFiles } = useAppSelector(selectNominationFileList);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(listNominationFile());
  }, [dispatch]);

  return nominationFiles.length ? (
    <div className="flex flex-col">
      <div className={cx("fr-h1", "fr-text--bold")}>Mes rapports</div>
      <NominationFilesTable nominationFiles={nominationFiles} />
    </div>
  ) : (
    <div>Aucune nomination.</div>
  );
};
export default NominationFileList;
