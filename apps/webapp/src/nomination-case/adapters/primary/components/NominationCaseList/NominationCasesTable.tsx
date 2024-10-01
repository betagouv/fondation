import { routes } from "../../../../../router/router";
import { NominationCaseListItemVM } from "../../presenters/selectNominationCaseList";
import { Table } from "@codegouvfr/react-dsfr/Table";

export type NominationCasesTableProps = {
  nominationCases: NominationCaseListItemVM[];
};

export const NominationCasesTable: React.FC<NominationCasesTableProps> = ({
  nominationCases,
}) => {
  return (
    <Table
      caption="Liste des nominations"
      headers={["Nom"]}
      data={nominationCases.map((nominationCase) => [
        <a {...routes.nominationCaseOverview({ id: nominationCase.id }).link}>
          {nominationCase.name}
        </a>,
      ])}
    />
  );
};
