import { FormattedMessage } from 'react-intl';

export function PresentationsTabPast() {
  return (
    <>
      <h2 className="fr-h4 uppercase">
        <FormattedMessage defaultMessage="Restitutions passées" />
      </h2>
      <p className="text-md ml-2 italic text-gray-600">
        <FormattedMessage defaultMessage="aucune restitution passée" />
      </p>
    </>
  );
}
