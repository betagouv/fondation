import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { generatePassword } from '@/utils/password.utils';

export function GeneratedPasswordInput(props: {
  error?: string;
  label: string;
  onChange: (password: string) => void;
  password: string;
}) {
  const { formatMessage } = useIntl();
  const [isCopied, setCopied] = useState(false);

  return (
    <>
      <Input
        hintText={
          <span className="fr-mt-2v block">
            {formatMessage({
              defaultMessage: `Le mot de passe provisoire est à communiquer à la personne. Elle devra ensuite le modifier depuis "Mon compte"`,
            })}
          </span>
        }
        label={props.label}
        nativeInputProps={{ className: 'font-mono', readOnly: true, value: props.password }}
        state={props.error ? 'error' : undefined}
        stateRelatedMessage={props.error}
      />
      <div className="fr-mt-n4v flex gap-2">
        <Button
          iconId={isCopied ? 'fr-icon-check-line' : 'fr-icon-clipboard-line'}
          onClick={async () => {
            await navigator.clipboard.writeText(props.password);
            setCopied(true);
          }}
          priority="tertiary"
          size="small"
          type="button"
        >
          {isCopied ? (
            <FormattedMessage defaultMessage="Copié" />
          ) : (
            <FormattedMessage defaultMessage="Copier" />
          )}
        </Button>
        <Button
          iconId="fr-icon-refresh-line"
          onClick={() => {
            props.onChange(generatePassword());
            setCopied(false);
          }}
          priority="tertiary no outline"
          size="small"
          type="button"
        >
          <FormattedMessage defaultMessage="Générer un autre" />
        </Button>
      </div>
    </>
  );
}
