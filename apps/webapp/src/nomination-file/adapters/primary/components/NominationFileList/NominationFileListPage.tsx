import { fr } from "@codegouvfr/react-dsfr";
import NominationFileList from "./NominationFileList";

export const NominationFileListPage = () => {
  return (
    <div className={fr.cx("fr-px-15w", "fr-py-15w")}>
      <NominationFileList />
    </div>
  );
};
export default NominationFileListPage;
