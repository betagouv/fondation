import { Table } from "@codegouvfr/react-dsfr/Table";
import { NominationFileListItemVM } from "../../selectors/selectNominationFileList";

export type NominationFilesTableProps = {
  nominationFiles: NominationFileListItemVM[];
};

export const NominationFilesTable: React.FC<NominationFilesTableProps> = ({
  nominationFiles,
}) => (
  <Table
    caption="Liste des nominations"
    headers={["Echéance", "Magistrat concerné"]}
    bordered
    data={nominationFiles.map((nominationFile) => [
      <a href={nominationFile.href} onClick={nominationFile.onClick}>
        {nominationFile.dueDate}
      </a>,
      <a href={nominationFile.href} onClick={nominationFile.onClick}>
        {nominationFile.title}
      </a>,
    ])}
  />
);
