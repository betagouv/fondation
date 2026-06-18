import Button from '@codegouvfr/react-dsfr/Button';
import Select from '@codegouvfr/react-dsfr/Select';
import Tag from '@codegouvfr/react-dsfr/Tag';
import React, { type SyntheticEvent } from 'react';

import { useAlerts } from '@/shared/context/alerts/alerts.context';
import { useConfirmation } from '@/shared/context/confirmation/useConfirmation.hook';
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
  const confirmation = useConfirmation();
  const alerts = useAlerts();
  const [isEditing, setEditing] = React.useState<boolean>(false);

  const assumedTitle = React.useMemo(() => getAssumedTitle(member.role), [member]);

  const { mutateAsync: updateTitle, isPending: isUpdating } = useUpdateTitleMutation({
    userId: member.id,
  });

  const onUpdate = React.useCallback(
    async (title: MemberTitleValue) => {
      const { isConfirmed } = await confirmation.waitForConfirmation({
        title: 'Définir la distinction ?',
        content: (
          <>
            Définir la distinction de <span className="title">"{TITLE_LABELS[title]}"</span>.
          </>
        ),
      });

      if (isConfirmed) {
        await updateTitle(title, {
          onSuccess() {
            setEditing(false);
          },

          onError: () => {
            alerts.pushAlert({
              severity: 'error',
              title: 'Erreur pendant la définition de la distinction',
            });
          },
        });
      } else {
        setEditing(false);
      }
    },
    [confirmation, alerts, updateTitle],
  );

  const onDelete = React.useCallback(
    async (e: SyntheticEvent | undefined) => {
      e?.preventDefault();

      const { isConfirmed } = await confirmation.waitForConfirmation({
        title: 'Supprimer la distinction ?',
        content: <p>Confirmer la suppression de la distinction. Vous pourrez la modifier ultérieurement</p>,
      });

      if (isConfirmed) {
        await updateTitle(null, {
          onSuccess: () => setEditing(false),
          onError: () => {
            alerts.pushAlert({
              severity: 'error',
              title: 'Erreur pendant la suppression de la distinction',
            });
          },
        });
      } else {
        setEditing(false);
      }
    },
    [confirmation, alerts, updateTitle],
  );

  if (member.title) {
    return (
      <dd className="flex items-center gap-2">
        <Tag
          as="button"
          iconId="ri-delete-bin-fill"
          nativeButtonProps={{ onClick: onDelete }}
          className="transition-colors duration-100"
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
          priority="tertiary no outline"
          size="small"
          iconId="fr-icon-edit-fill"
          onClick={() => onUpdate(assumedTitle)}
        >
          Définir "{TITLE_LABELS[assumedTitle]}"
        </Button>
      </dd>
    );
  }

  if (!isEditing) {
    return (
      <dd>
        <Button
          size="small"
          iconId="fr-icon-edit-fill"
          priority="tertiary no outline"
          onClick={() => setEditing(true)}
          title="Défiinir une distinction"
          className="rounded-full"
        />
      </dd>
    );
  }

  return (
    <dd className="items-top flex">
      <Select
        label=""
        disabled={isUpdating}
        nativeSelectProps={{
          value: '',
          autoFocus: true,
          onChange: (e) => onUpdate(e.target.value as MemberTitleValue),
        }}
      >
        <option value="" disabled>
          Choisir une distinction
        </option>

        <option value="PRESIDENT_SIEGE">Président Siège</option>
        <option value="PRESIDENT_PARQUET">Président Parquet</option>
      </Select>
      <Button
        className="fr-mt-1v fr-ml-1v rounded-full"
        priority="tertiary no outline"
        iconId="fr-icon-close-line"
        onClick={() => setEditing(false)}
        title="Fermer"
      />
    </dd>
  );
}

export function MemberTitle(props: {
  member: { id: string; title: MemberTitleValue | null; role: MemberRole };
}) {
  return (
    <div className="flex flex-row items-center justify-between">
      <dt className="font-bold">Distinction</dt>
      <MemberTitleAction member={props.member} />
    </div>
  );
}
