import { Table } from "@codegouvfr/react-dsfr/Table";
import { selectNominationCaseOverviewAnchorLink } from "../../../../../router/adapters/selectors/selectNominationCaseOverviewAnchorLink";
import { useAppSelector } from "../../hooks/react-redux";
import { NominationCaseListItemVM } from "../../selectors/selectNominationCaseList";

export type NominationCasesTableProps = {
  nominationCases: NominationCaseListItemVM[];
};

export const NominationCasesTable: React.FC<NominationCasesTableProps> = ({
  nominationCases,
}) => {
  const anchorAttributes = useAppSelector((state) =>
    selectNominationCaseOverviewAnchorLink(
      state,
      nominationCases.map((nominationCase) => nominationCase.id)
    )
  );

  return (
    <Table
      caption="Liste des nominations"
      headers={["Nom"]}
      data={nominationCases.map((nominationCase) => [
        <a {...anchorAttributes[nominationCase.id]}>{nominationCase.name}</a>,
      ])}
    />
  );
};
