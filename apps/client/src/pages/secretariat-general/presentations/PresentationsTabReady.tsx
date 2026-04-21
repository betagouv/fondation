import { FormattedMessage } from 'react-intl';

export function PresentationsTabReady() {
  return (
    <>
      <h2>
        <FormattedMessage defaultMessage="Notices prêtes" />
      </h2>
      <h2>
        <FormattedMessage defaultMessage="Ordres du jour prêts" />
      </h2>
    </>
  );
}
