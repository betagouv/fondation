import { memberFullName } from '@/utils/user.utils';

import { propositionLabel, type MemberPropositions } from './recused-reporters';

export function MemberPropositionsList(props: { members: readonly MemberPropositions[] }) {
  return (
    <ul>
      {props.members.map(({ files, member }) => (
        <li key={member.id}>{`${memberFullName(member)} : ${files.map(propositionLabel).join(', ')}`}</li>
      ))}
    </ul>
  );
}
