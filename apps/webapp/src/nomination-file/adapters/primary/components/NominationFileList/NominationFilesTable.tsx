import { Table } from "@codegouvfr/react-dsfr/Table";
import { NominationFileListItemVM } from "../../selectors/selectNominationFileList";
import "./NominationFilesTable.css";

export type NominationFilesTableProps = {
  nominationFiles: NominationFileListItemVM[];
};

export const NominationFilesTable: React.FC<NominationFilesTableProps> = ({
  nominationFiles,
}) => (
  <Table
    id="nomination-files-table"
    headers={[
      "N° dossier",
      "Formation",
      "Etat",
      "Echéance",
      "Magistrat concerné",
      "Transparence",
      "Grade actuel",
      "Poste ciblé",
      "Observants",
    ]}
    bordered
    data={nominationFiles.map((nominationFile) => [
      <div>{nominationFile.folderNumber}</div>,
      <div>{nominationFile.formation}</div>,
      <div>{nominationFile.state}</div>,
      <div>{nominationFile.dueDate}</div>,
      <a href={nominationFile.href} onClick={nominationFile.onClick}>
        {nominationFile.name}
      </a>,
      <div>{nominationFile.transparency}</div>,
      <div className="text-center">{nominationFile.grade}</div>,
      <div>{nominationFile.targettedPosition}</div>,
      <div className="text-center">{nominationFile.observersCount}</div>,
    ])}
  />
);
