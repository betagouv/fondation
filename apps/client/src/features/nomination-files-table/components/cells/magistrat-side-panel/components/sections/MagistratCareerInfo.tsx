import { labels } from '@/constants/labels.constants';
import { FormattedBirthDate } from '@/i18n/components';
import { useIntlPositionDuration } from '@/i18n/hooks';
import { TextValue } from '@/shared/ui/TextValue';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

function positionWithGrade(position: string | null, grade: string | null) {
  if (!position) return grade ?? '';
  return grade ? `${position} (${grade})` : position;
}

export function MagistratCareerInfo(props: { content: SessionNominationFile['content'] }) {
  const {
    dateDeNaissance,
    datePriseDeFonctionPosteActuel,
    grade,
    gradeCible,
    posteActuel,
    posteCible,
    rang,
  } = props.content;

  const formatDuration = useIntlPositionDuration();
  const positionDuration = datePriseDeFonctionPosteActuel
    ? formatDuration(datePriseDeFonctionPosteActuel)
    : null;

  return (
    <div className="flex flex-col gap-2">
      <TextValue label={labels.magistrat.birthDate} value={<FormattedBirthDate value={dateDeNaissance} />} />
      <TextValue label={labels.magistrat.currentPosition} value={positionWithGrade(posteActuel, grade)} />
      {positionDuration && <TextValue label={labels.magistrat.dureeDuPoste} value={positionDuration} />}
      <TextValue
        label={labels.magistrat.targettedPosition}
        value={positionWithGrade(posteCible, gradeCible)}
      />
      <TextValue label={labels.magistrat.rank} value={rang?.replace(/^\(|\)$/g, '')} />
    </div>
  );
}
