import Button from '@codegouvfr/react-dsfr/Button';
import Select from '@codegouvfr/react-dsfr/Select';
import Tag from '@codegouvfr/react-dsfr/Tag';
import { useCallback, useMemo, useState, type SyntheticEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useToasts } from '@/shared/ui/toast';
import { useUpdateTitleMutation } from '@queries/members.queries';

type MemberTitleValue = 'PRESIDENT_PARQUET' | 'PRESIDENT_SIEGE';
type MemberRole = 'MEMBRE_COMMUN' | 'MEMBRE_DU_PARQUET' | 'MEMBRE_DU_SIEGE';

const TITLE_LABELS: Record<MemberTitleValue, string> = {
  PRESIDENT_SIEGE: 'Président du Siège',
  PRESIDENT_PARQUET: 'Président du Parquet',
};

function getAssumedTitle(role: MemberRole): MemberTitleValue | null {
  if (role === 'MEMBRE_DU_SIEGE') return 'PRESIDENT_SIEGE';
  if (role === 'MEMBRE_DU_PARQUET') return 'PRESIDENT_PARQUET';
  return null;
}

function MemberTitleAction(props: {
  member: { id: string; role: MemberRole; title: MemberTitleValue | null };
}) {
  const { member } = props;
  const { formatMessage } = useIntl();
  const confirmation = useConfirmModal();
  const toasts = useToasts();
  const [isEditing, setEditing] = useState<boolean>(false);

  const assumedTitle = useMemo(() => getAssumedTitle(member.role), [member]);

  const { mutate: updateTitle, isPending: isUpdating } = useUpdateTitleMutation({
    userId: member.id,
  });

  const onUpdate = useCallback(
    async (title: MemberTitleValue) => {
      const { isConfirmed } = await confirmation.waitForConfirmation({
        content: (
          <FormattedMessage
            defaultMessage='Définir la distinction de <name>"{title}"</name>.'
            values={{
              name: (chunks) => <span className="title">{chunks}</span>,
              title: TITLE_LABELS[title],
            }}
          />
        ),
        title: formatMessage({ defaultMessage: 'Définir la distinction ?' }),
      });

      if (isConfirmed) {
        updateTitle(title, {
          onSuccess() {
            setEditing(false);
          },

          onError: () => {
            toasts.error({
              title: formatMessage({ defaultMessage: 'Erreur pendant la définition de la distinction' }),
            });
          },
        });
      } else {
        setEditing(false);
      }
    },
    [confirmation, formatMessage, toasts, updateTitle],
  );

  const onDelete = useCallback(
    async (e: SyntheticEvent | undefined) => {
      e?.preventDefault();

      const { isConfirmed } = await confirmation.waitForConfirmation({
        content: (
          <p>
            <FormattedMessage defaultMessage="Confirmer la suppression de la distinction. Vous pourrez la modifier ultérieurement" />
          </p>
        ),
        title: formatMessage({ defaultMessage: 'Supprimer la distinction ?' }),
      });

      if (isConfirmed) {
        updateTitle(null, {
          onSuccess: () => setEditing(false),
          onError: () => {
            toasts.error({
              title: formatMessage({ defaultMessage: 'Erreur pendant la suppression de la distinction' }),
            });
          },
        });
      } else {
        setEditing(false);
      }
    },
    [confirmation, formatMessage, toasts, updateTitle],
  );

  if (member.title) {
    return (
      <dd className="flex items-center gap-2">
        <Tag
          as="button"
          className="transition-colors duration-100"
          iconId="ri-delete-bin-fill"
          nativeButtonProps={{ onClick: onDelete }}
        >
          {TITLE_LABELS[member.title]}
        </Tag>
      </dd>
    );
  }

  if (assumedTitle) {
    return (
      <dd>
        <Button
          iconId="fr-icon-edit-fill"
          onClick={() => onUpdate(assumedTitle)}
          priority="tertiary no outline"
          size="small"
        >
          <FormattedMessage
            defaultMessage='Définir "{title}"'
            values={{ title: TITLE_LABELS[assumedTitle] }}
          />
        </Button>
      </dd>
    );
  }

  if (!isEditing) {
    return (
      <dd>
        <Button
          className="rounded-full"
          iconId="fr-icon-edit-fill"
          onClick={() => setEditing(true)}
          priority="tertiary no outline"
          size="small"
          title={formatMessage({ defaultMessage: 'Définir une distinction' })}
        />
      </dd>
    );
  }

  return (
    <dd className="items-top flex">
      <Select
        disabled={isUpdating}
        label=""
        nativeSelectProps={{
          value: '',
          autoFocus: true,
          onChange: (e) => onUpdate(e.target.value as MemberTitleValue),
        }}
      >
        <option disabled value="">
          {formatMessage({ defaultMessage: 'Choisir une distinction' })}
        </option>

        <option value="PRESIDENT_SIEGE">{TITLE_LABELS.PRESIDENT_SIEGE}</option>
        <option value="PRESIDENT_PARQUET">{TITLE_LABELS.PRESIDENT_PARQUET}</option>
      </Select>
      <Button
        className="fr-mt-1v fr-ml-1v rounded-full"
        iconId="fr-icon-close-line"
        onClick={() => setEditing(false)}
        priority="tertiary no outline"
        title={formatMessage({ defaultMessage: 'Fermer' })}
      />
    </dd>
  );
}

export function MemberTitle(props: {
  member: { id: string; title: MemberTitleValue | null; role: MemberRole };
}) {
  return (
    <div className="flex flex-row items-center justify-between">
      <dt className="font-bold">
        <FormattedMessage defaultMessage="Distinction" />
      </dt>
      <MemberTitleAction member={props.member} />
    </div>
  );
}
