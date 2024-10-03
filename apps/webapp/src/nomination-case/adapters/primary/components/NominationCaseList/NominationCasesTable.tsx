import { Table } from "@codegouvfr/react-dsfr/Table";
import { NominationCaseListItemVM } from "../../selectors/selectNominationCaseList";

export type NominationCasesTableProps = {
  nominationCases: NominationCaseListItemVM[];
};

export const NominationCasesTable: React.FC<NominationCasesTableProps> = ({
  nominationCases,
}) => (
  <Table
    caption="Liste des nominations"
    headers={["Nom"]}
    data={nominationCases.map((nominationCase) => [
      <a href={nominationCase.href} onClick={nominationCase.onClick}>
        {nominationCase.name}
      </a>,
    ])}
  />
);
