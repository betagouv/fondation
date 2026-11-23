import { FormattedMessage, useIntl } from 'react-intl';

import { memberFullName } from '@/utils/user.utils';

import { propositionLabel, type MemberPropositions } from './recused-reporters';

function propositionNumbers(files: MemberPropositions['files']): string[] {
  return files.map((file) =>
    file.content.numeroDeDossier === null ? propositionLabel(file) : `n° ${file.content.numeroDeDossier}`,
  );
}

/** the members who excluded the proposed magistrat of selected propositions, which they cannot be affected to */
export function AffectedExcludingMembersNotice(props: {
  /** whether the affectation is still saved on other selected propositions */
  hasOtherPropositions: boolean;
  members: readonly MemberPropositions[];
}) {
  const { formatList } = useIntl();

  return (
    <>
      <p>
        <FormattedMessage
          defaultMessage="{count, plural, one {Ce membre a exclu le magistrat proposé de propositions sélectionnées, auxquelles il ne peut pas être affecté :} other {Ces membres ont exclu le magistrat proposé de propositions sélectionnées, auxquelles ils ne peuvent pas être affectés :}}"
          values={{ count: props.members.length }}
        />
      </p>
      <ul>
        {props.members.map(({ files, member }) => (
          <li key={member.id}>{`${memberFullName(member)} : ${formatList(propositionNumbers(files))}`}</li>
        ))}
      </ul>
      {props.hasOtherPropositions && (
        <p>
          <FormattedMessage defaultMessage="L'affectation sera bien enregistrée sur les autres propositions sélectionnées." />
        </p>
      )}
    </>
  );
}
