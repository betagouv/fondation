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
    headers={["Echéance", "Magistrat concerné"]}
    bordered
    data={nominationFiles.map((nominationFile) => [
      <div>{nominationFile.dueDate}</div>,
      <a href={nominationFile.href} onClick={nominationFile.onClick}>
        {nominationFile.title}
      </a>,
    ])}
  />
);
