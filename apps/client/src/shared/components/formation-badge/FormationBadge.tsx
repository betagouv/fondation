import Badge from '@codegouvfr/react-dsfr/Badge';
import { FormattedMessage } from 'react-intl';

import { type FormationEnum, FormationEnumMessages } from '@/shared/enums/formation.enum';

export function FormationBadge(props: { className?: string; formation: FormationEnum; small?: boolean }) {
  return (
    <Badge as="span" className={props.className} noIcon small={props.small}>
      <FormattedMessage {...FormationEnumMessages[props.formation]} />
    </Badge>
  );
}
