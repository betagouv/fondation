import { FormattedMessage } from 'react-intl';

import { MemberPropositionsList } from './MemberPropositionsList';
import type { MemberPropositions } from './recused-reporters';

export function AffectedRecusedMembersNotice(props: { members: readonly MemberPropositions[] }) {
  const recusalCount = props.members.reduce((count, { files }) => count + files.length, 0);

  return (
    <>
      <p>
        {props.members.length > 1 ? (
          <FormattedMessage
            defaultMessage={`Ces membres se sont déportés de dossiers sélectionnés. Avec cette affectation, leurs rapports sur ces dossiers passent à « Sans objet » et en lecture seule.`}
          />
        ) : recusalCount > 1 ? (
          <FormattedMessage
            defaultMessage={`Ce membre s'est déporté de dossiers sélectionnés. Avec cette affectation, ses rapports sur ces dossiers passent à « Sans objet » et en lecture seule.`}
          />
        ) : (
          <FormattedMessage
            defaultMessage={`Ce membre s'est déporté d'un dossier sélectionné. Avec cette affectation, son rapport sur ce dossier passe à « Sans objet » et en lecture seule.`}
          />
        )}
      </p>
      <MemberPropositionsList members={props.members} />
    </>
  );
}
