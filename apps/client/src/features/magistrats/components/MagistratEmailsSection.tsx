import clsx from 'clsx';
import { useId } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useConfirmModal } from '@/shared/context/confirm-modal';
import { IconButton } from '@/shared/ui/icon-button';
import { LoadFailure } from '@/shared/ui/load-failure';
import { useToasts } from '@/shared/ui/toast';
import { Tooltip } from '@/shared/ui/tooltip';
import { whoWrote } from '@/utils/user.utils';
import { ValidationError } from '@/utils/validation-error';
import { useUser } from '@queries/auth.queries';
import {
  type MagistratAttachedEmail,
  useDetachMagistratEmailMutation,
  useMagistratAttachedEmailsQuery,
} from '@queries/magistrats.queries';

export function MagistratEmailsSection(props: {
  magistratId: string;
  magistratName: string;
  professionalEmail: string | null;
}) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const { waitForConfirmation } = useConfirmModal();
  const attachedEmails = useMagistratAttachedEmailsQuery(props);
  const attached = attachedEmails.data ?? [];
  const detach = useDetachMagistratEmailMutation(props);
  const titleId = useId();
  const professionalEmail = props.professionalEmail?.toLowerCase();
  const emailCount = attached.length + (professionalEmail ? 1 : 0);

  const confirmDetachment = async (email: MagistratAttachedEmail) => {
    const { isConfirmed } = await waitForConfirmation({
      content: (
        <p className="fr-mb-0">
          <FormattedMessage
            defaultMessage="Le site du CSM ne reconnaîtra plus {name} à l'adresse {email}."
            values={{ email: <strong>{email.email}</strong>, name: props.magistratName }}
          />
        </p>
      ),
      i18n: { confirm: formatMessage({ defaultMessage: 'Détacher' }) },
      title: formatMessage({ defaultMessage: "Détacher l'adresse ?" }),
    });
    if (!isConfirmed) return;

    detach.mutate(email.id, {
      onError: (error) =>
        toasts.error({
          description:
            ValidationError.messageOf(error) ??
            formatMessage({ defaultMessage: 'Réessayez et prévenez le support si cela persiste.' }),
          title: formatMessage({ defaultMessage: "L'adresse n'a pas été détachée" }),
        }),
      onSuccess: () =>
        toasts.success({ title: formatMessage({ defaultMessage: "L'adresse a été détachée" }) }),
    });
  };

  return (
    <div className="fr-mb-2v">
      <div className={clsx(emailCount <= 1 && 'flex items-center gap-1')}>
        <h3
          className={clsx(
            'flex min-h-8 items-center text-base font-bold text-(--text-default-grey)',
            emailCount <= 1 ? 'fr-m-0' : 'fr-mb-1v',
          )}
          id={titleId}
        >
          <FormattedMessage
            defaultMessage="{count, plural, =0 {Email} one {Email} other {Adresses email}}"
            values={{ count: emailCount }}
          />
        </h3>
        {emailCount ? (
          <ul aria-labelledby={titleId} className="m-0 flex min-w-0 grow list-none flex-col p-0">
            {professionalEmail ? (
              <EmailItem
                email={professionalEmail}
                origin={formatMessage({ defaultMessage: 'Enregistrée dans LOLFI' })}
              />
            ) : null}
            {attached.map((email) => (
              <AttachedEmailItem
                disabled={detach.isPending}
                email={email}
                key={email.id}
                onDetach={() => void confirmDetachment(email)}
              />
            ))}
          </ul>
        ) : (
          <p className="fr-mb-0">-</p>
        )}
      </div>
      {attachedEmails.isError ? (
        <LoadFailure
          isRetrying={attachedEmails.isFetching}
          message={<FormattedMessage defaultMessage="Les adresses rattachées n'ont pas pu être chargées" />}
          onRetry={() => void attachedEmails.refetch()}
        />
      ) : null}
    </div>
  );
}

function AttachedEmailItem(props: {
  disabled: boolean;
  email: MagistratAttachedEmail;
  onDetach: () => void;
}) {
  const { formatDate, formatMessage } = useIntl();
  const { user } = useUser();
  const { email } = props;

  return (
    <EmailItem
      email={email.email}
      origin={formatMessage(
        {
          defaultMessage:
            'Rattachée dans Fondation le {date}{who, select, self { par vous} someone { par {name}} other {}} pour le site du CSM',
        },
        {
          date: formatDate(email.attachedAt, { format: 'zonedDateShort' }),
          name: email.attachedBy?.name,
          who: whoWrote({ currentUserId: user?.id, writer: email.attachedBy }),
        },
      )}
    >
      <IconButton
        disabled={props.disabled}
        iconId="fr-icon-delete-line"
        label={formatMessage({ defaultMessage: 'Détacher {email}' }, { email: email.email })}
        onClick={props.onDetach}
        small
      />
    </EmailItem>
  );
}

function EmailItem(props: { children?: React.ReactNode; email: string; origin: string }) {
  return (
    <li className="flex min-h-8 items-center gap-3 p-0">
      <Tooltip className="min-w-0 wrap-break-word" focusable label={props.origin}>
        {props.email}
      </Tooltip>
      {props.children ? <span className="ml-auto flex shrink-0 items-center">{props.children}</span> : null}
    </li>
  );
}
