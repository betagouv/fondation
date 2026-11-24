import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';

import { Tooltip } from '@/shared/ui/tooltip';

const ICON_CLASS = clsx(cx('fr-icon-error-line'), 'fr-icon--sm', 'shrink-0', 'align-middle');
const ICON_STYLE = { color: colors.decisions.text.default.warning.default };

export function ExcludedJurisdictionIcon(props: { title?: string }) {
  if (!props.title) return <i aria-hidden className={ICON_CLASS} style={ICON_STYLE} />;

  return (
    <Tooltip label={props.title}>
      <i aria-label={props.title} className={ICON_CLASS} role="img" style={ICON_STYLE} />
    </Tooltip>
  );
}
