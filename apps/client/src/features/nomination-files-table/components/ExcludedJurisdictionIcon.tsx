import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { Tooltip } from '@/shared/ui/tooltip';

const ICON_CLASS = clsx(cx('fr-icon-warning-fill'), 'fr-icon--sm', 'shrink-0', 'align-middle');
const ICON_STYLE = { color: colors.decisions.text.default.warning.default };

export function ExcludedJurisdictionIcon(props: { title?: string }) {
  const { formatMessage } = useIntl();

  if (!props.title) return <i aria-hidden className={ICON_CLASS} style={ICON_STYLE} />;

  return (
    <Tooltip label={props.title}>
      <i
        aria-label={formatMessage({ defaultMessage: 'Juridiction exclue' })}
        className={ICON_CLASS}
        role="img"
        style={ICON_STYLE}
      />
    </Tooltip>
  );
}
