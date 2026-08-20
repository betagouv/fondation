import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useConfirmation } from '@/shared/context/confirmation';
import { useUpdateNominationFileMissingEvaluationMutation } from '@queries/members.queries';

export function MissingEvaluationDoneButton(props: {
  disabled: boolean;
  magistrat: string;
  nominationFileId: string;
  sessionId: string;
}) {
  const { formatMessage } = useIntl();
  const confirmation = useConfirmation();
  const { mutate, isPending } = useUpdateNominationFileMissingEvaluationMutation();

  const onClick = useCallback(async () => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: formatMessage({ defaultMessage: 'Confirmer la présence de l’évaluation' }),
      content: (
        <>
          <p>
            <FormattedMessage
              defaultMessage="Vous confirmez que la ou les évaluations de {magistrat} sont désormais présentes sur son dossier administratif LOLFI."
              values={{ magistrat: props.magistrat }}
            />
          </p>
          <p>
            <FormattedMessage defaultMessage="La ligne disparaîtra du tableau et le commentaire sera effacé." />
          </p>
        </>
      ),
    });

    if (!isConfirmed) return;

    mutate({
      missingEvaluation: false,
      nominationFileId: props.nominationFileId,
      sessionId: props.sessionId,
    });
  }, [confirmation, formatMessage, mutate, props.magistrat, props.nominationFileId, props.sessionId]);

  return (
    <Button
      className="whitespace-nowrap"
      disabled={props.disabled || isPending}
      iconId="ri-check-line"
      iconPosition="right"
      nativeButtonProps={confirmation.buttonProps}
      onClick={onClick}
      priority="secondary"
      size="small"
    >
      <FormattedMessage defaultMessage="Marquer comme ajoutée" />
    </Button>
  );
}
