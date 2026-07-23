import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { FormattedBirthDate } from '@/i18n/components';
import type { PlainDateOnly } from '@/utils/date-only.util';

function TextValue(props: { label: string; value: ReactNode }) {
  return (
    <div className="leading-7">
      <span className={cx('fr-text--bold')}>{`${props.label} : `}</span>
      <span>{props.value}</span>
    </div>
  );
}

function withGrade(grade: string | null, position: string | null) {
  return [grade, position].filter(Boolean).join(' - ');
}

export function IdentityList(props: {
  birthDate: Date | PlainDateOnly | null;
  currentPosition: string | null;
  grade: string | null;
  positionDuration?: ReactNode;
  rank: string | null;
  targetedGrade: string | null;
  targetedPosition: string | null;
}) {
  const { formatMessage } = useIntl();

  const currentPosition = withGrade(props.grade, props.currentPosition);
  const targetedPosition = withGrade(props.targetedGrade, props.targetedPosition);

  return (
    <div className="flex flex-col gap-2">
      {props.birthDate && (
        <TextValue
          label={formatMessage({ defaultMessage: 'Date de naissance' })}
          value={<FormattedBirthDate value={props.birthDate} />}
        />
      )}

      {currentPosition && (
        <TextValue label={formatMessage({ defaultMessage: 'Poste actuel' })} value={currentPosition} />
      )}

      {props.positionDuration && (
        <TextValue
          label={formatMessage({ defaultMessage: 'Durée sur le poste' })}
          value={props.positionDuration}
        />
      )}

      {targetedPosition && (
        <TextValue label={formatMessage({ defaultMessage: 'Poste cible' })} value={targetedPosition} />
      )}

      {props.rank && (
        <TextValue
          label={formatMessage({ defaultMessage: 'Rang' })}
          value={props.rank.replace(/^\(|\)$/g, '')}
        />
      )}
    </div>
  );
}
