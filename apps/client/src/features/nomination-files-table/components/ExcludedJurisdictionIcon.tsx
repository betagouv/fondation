import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

export function ExcludedJurisdictionIcon(props: { title?: string }) {
  const { formatMessage } = useIntl();
  const description =
    props.title ?? formatMessage({ defaultMessage: 'Juridiction exclue pour ce rapporteur' });

  return (
    <Tooltip title={description}>
      <i
        aria-label={formatMessage({ defaultMessage: 'Juridiction exclue' })}
        className={clsx(cx('fr-icon-warning-fill'), 'fr-icon--sm', 'align-middle')}
        role="img"
        style={{ color: colors.decisions.text.default.warning.default }}
      />
    </Tooltip>
  );
}
