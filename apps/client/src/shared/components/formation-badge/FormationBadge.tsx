import Badge from '@codegouvfr/react-dsfr/Badge';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

import { type FormationEnum, FormationEnumMessages } from '@/shared/enums/formation.enum';

export function FormationBadge(props: { className?: string; formation: FormationEnum; small?: boolean }) {
  return (
    <Badge as="span" className={clsx(props.small && 'h-6', props.className)} noIcon small={props.small}>
      <FormattedMessage {...FormationEnumMessages[props.formation]} />
    </Badge>
  );
}
