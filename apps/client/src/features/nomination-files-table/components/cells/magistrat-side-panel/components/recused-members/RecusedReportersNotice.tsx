import { FormattedMessage } from 'react-intl';

import { memberFullName } from '@/utils/user.utils';

import { MemberPropositionsList } from './MemberPropositionsList';
import { propositionLabel, type MemberPropositions } from './recused-reporters';

export function RecusedReportersNotice(props: {
  /** whether the recusal is still saved on other selected propositions */
  hasOtherPropositions: boolean;
  reporters: readonly MemberPropositions[];
}) {
  const [first] = props.reporters;
  const [file] = first?.files ?? [];

  if (props.reporters.length === 1 && first?.files.length === 1 && file)
    return (
      <p>
        <FormattedMessage
          defaultMessage="Vous souhaitez enregistrer le déport de {member} sur la proposition de nomination de {proposition}, dont ce membre est rapporteur. Pour pouvoir enregistrer ce déport, vous devez au préalable modifier le rapporteur, puis publier la nouvelle affectation si ce membre est rapporteur dans la version publiée."
          values={{ member: memberFullName(first.member), proposition: propositionLabel(file) }}
        />
        {props.hasOtherPropositions && (
          <>
            {' '}
            <FormattedMessage defaultMessage="Le déport sera bien enregistré sur les autres propositions sélectionnées." />
          </>
        )}
      </p>
    );

  return (
    <>
      <p>
        <FormattedMessage defaultMessage="Vous souhaitez enregistrer le déport de membres sur des propositions de nomination dont ils sont rapporteurs :" />
      </p>
      <MemberPropositionsList members={props.reporters} />
      <p>
        <FormattedMessage defaultMessage="Pour pouvoir enregistrer ces déports, vous devez au préalable modifier les rapporteurs, puis publier la nouvelle affectation pour ceux qui sont rapporteurs dans la version publiée." />
        {props.hasOtherPropositions && (
          <>
            {' '}
            <FormattedMessage defaultMessage="Les déports seront bien enregistrés sur les autres propositions sélectionnées." />
          </>
        )}
      </p>
    </>
  );
}
