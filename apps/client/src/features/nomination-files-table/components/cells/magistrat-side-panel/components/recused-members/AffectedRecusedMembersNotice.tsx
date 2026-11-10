import { FormattedMessage } from 'react-intl';

import { memberFullName } from '@/utils/user.utils';

import { MemberPropositionsList } from './MemberPropositionsList';
import { propositionLabel, type MemberPropositions } from './recused-reporters';

export function AffectedRecusedMembersNotice(props: {
  /** whether the affectation is still saved on other selected propositions */
  hasOtherPropositions: boolean;
  members: readonly MemberPropositions[];
}) {
  const [first] = props.members;
  const [file] = first?.files ?? [];
  const savedElsewhere = props.hasOtherPropositions && (
    <>
      {' '}
      <FormattedMessage defaultMessage="L'affectation sera bien enregistrée sur les autres propositions sélectionnées." />
    </>
  );

  if (props.members.length === 1 && first?.files.length === 1 && file)
    return (
      <p>
        <FormattedMessage
          defaultMessage="Vous souhaitez affecter {member} à la proposition de nomination de {proposition}, dont ce membre s'est déporté. Pour pouvoir l'affecter, vous devez au préalable retirer son déport."
          values={{ member: memberFullName(first.member), proposition: propositionLabel(file) }}
        />
        {savedElsewhere}
      </p>
    );

  return (
    <>
      <p>
        <FormattedMessage defaultMessage="Vous souhaitez affecter des membres à des propositions de nomination dont ils se sont déportés :" />
      </p>
      <MemberPropositionsList members={props.members} />
      <p>
        <FormattedMessage defaultMessage="Pour pouvoir les affecter, vous devez au préalable retirer leur déport." />
        {savedElsewhere}
      </p>
    </>
  );
}
