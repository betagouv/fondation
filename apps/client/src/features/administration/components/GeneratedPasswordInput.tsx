import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useId, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { generatePassword } from '@/utils/password.utils';

export function GeneratedPasswordInput(props: {
  error?: string;
  hint: string;
  label: string;
  onChange: (password: string) => void;
  password: string;
}) {
  const [isCopied, setCopied] = useState(false);
  const inputId = useId();

  return (
    <>
      <Input
        hintText={<span className="fr-mt-2v block">{props.hint}</span>}
        label={props.label}
        nativeInputProps={{ className: 'font-mono', id: inputId, readOnly: true, value: props.password }}
        state={props.error ? 'error' : undefined}
        stateRelatedMessage={props.error}
      />
      <div className="fr-mt-n4v flex gap-2">
        <Button
          iconId={isCopied ? 'fr-icon-check-line' : 'fr-icon-clipboard-line'}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(props.password);
              setCopied(true);
            } catch {
              // the browser refuses the clipboard outside a secure context: the text is selected for a manual copy
              (document.getElementById(inputId) as HTMLInputElement | null)?.select();
            }
          }}
          priority="tertiary"
          size="small"
          type="button"
        >
          {isCopied ? (
            <FormattedMessage defaultMessage="Mot de passe copié" />
          ) : (
            <FormattedMessage defaultMessage="Copier le mot de passe" />
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
          <FormattedMessage defaultMessage="Générer un autre mot de passe" />
        </Button>
      </div>
    </>
  );
}
