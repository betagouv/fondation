import { FormattedPositionDuration } from '@/i18n/components';
import { IdentityList } from '@/shared/components/identity-list';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export function CareerInfo(props: { content: SessionNominationFile['content'] }) {
  const {
    dateDeNaissance,
    datePriseDeFonctionPosteActuel,
    grade,
    gradeCible,
    posteActuel,
    posteCible,
    rang,
  } = props.content;

  return (
    <IdentityList
      birthDate={dateDeNaissance}
      currentPosition={posteActuel}
      grade={grade}
      positionDuration={
        datePriseDeFonctionPosteActuel && <FormattedPositionDuration value={datePriseDeFonctionPosteActuel} />
      }
      rank={rang}
      targetedGrade={gradeCible}
      targetedPosition={posteCible}
    />
  );
}
