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
      "Etat",
      "Echéance",
      "Formation",
      "Magistrat concerné",
      "transparence",
      "Grade visé",
      "Poste ciblé",
    ]}
    bordered
    data={nominationFiles.map((nominationFile) => [
      <div>{nominationFile.state}</div>,
      <div>{nominationFile.dueDate}</div>,
      <div>{nominationFile.formation}</div>,
      <a href={nominationFile.href} onClick={nominationFile.onClick}>
        {nominationFile.name}
      </a>,
      <div>{nominationFile.transparency}</div>,
      <div>{nominationFile.grade}</div>,
      <div>{nominationFile.targettedPosition}</div>,
    ])}
  />
);
