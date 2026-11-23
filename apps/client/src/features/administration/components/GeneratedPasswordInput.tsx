import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { useId } from 'react';
import { FormattedMessage } from 'react-intl';

import { CopyButton } from '@/shared/ui/copy-button';
import { generatePassword } from '@/utils/password.utils';

export function GeneratedPasswordInput(props: {
  error?: string;
  hint: string;
  label: string;
  onChange: (password: string) => void;
  password: string;
}) {
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
        <CopyButton
          copiedLabel={<FormattedMessage defaultMessage="Mot de passe copié" />}
          inputId={inputId}
          label={<FormattedMessage defaultMessage="Copier le mot de passe" />}
          text={props.password}
        />
        <Button
          iconId="fr-icon-refresh-line"
          onClick={() => props.onChange(generatePassword())}
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
