import { FormattedMessage } from 'react-intl';

export function PrivateContentNotice() {
  return (
    <p className="fr-mb-0 rounded bg-(--background-contrast-grey) px-3 py-2 leading-relaxed text-(--text-default-grey)">
      <FormattedMessage
        defaultMessage="<b>Contenu privé</b> : non visible pendant une usurpation d'identité"
        values={{ b: (chunks) => <strong>{chunks}</strong> }}
      />
    </p>
  );
}
