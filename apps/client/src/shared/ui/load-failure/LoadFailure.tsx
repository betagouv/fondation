import Button from '@codegouvfr/react-dsfr/Button';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

export function LoadFailure(props: { isRetrying: boolean; message: ReactNode; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="fr-mb-0" role="status">
        {props.message}
      </p>
      <Button
        className="aria-disabled:cursor-not-allowed aria-disabled:text-(--text-disabled-grey) aria-disabled:shadow-[inset_0_0_0_1px_var(--border-disabled-grey)]"
        nativeButtonProps={props.isRetrying ? { 'aria-disabled': true } : undefined}
        onClick={props.isRetrying ? undefined : props.onRetry}
        priority="secondary"
        size="small"
      >
        <FormattedMessage defaultMessage="Réessayer" />
      </Button>
    </div>
  );
}
