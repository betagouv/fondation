import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import React from 'react';

import { useNominationFilesTable } from '../../../contexts/files-table.context';
import { observationFollowUpCommentModal } from '@/components/shared/observations/follow-up-selector/ObservationFollowUpCommentDialog';
import { ObservationFollowUpSelector } from '@/components/shared/observations/follow-up-selector/ObservationFollowUpSelector';
import { DateOnly } from '@/models/date-only.model';
import type { ObservationFollowupEnum } from '@/types/enums.types';
import { capitalize } from '@/utils/string.utils';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export const observationFollowUpReminderModal = createModal({
  isOpenedByDefault: false,
  id: `observation-follow-up-reminder-modal`,
});

type ObservationWithFollowUp = {
  id: string;
  followUp: ObservationFollowupEnum | null;
  followUpComment: string | null;
  date: { year: number; month: number; day: number };
  magistrat: { id: string; firstName: string; lastName: string };
};

function SingleObservationWithFollowUpSelector(props: {
  sessionId: string;
  nominationFileId: string;
  observation: ObservationWithFollowUp;
  onChange: (observation: ObservationWithFollowUp) => unknown;
}) {
  const formattedDate = React.useMemo(
    () => DateOnly.fromDateOnly(props.observation.date, 'dd/MM/yyyy'),
    [props.observation],
  );

  const onChange = React.useCallback(
    (data: { followUp: ObservationFollowupEnum | null; comment: string | null }) => {
      props.onChange({
        ...props.observation,
        followUp: data.followUp,
        followUpComment: data.comment,
      });
    },
    [props],
  );

  return (
    <div className="rounded-lg border-2 border-solid border-gray-100 p-2 pb-4">
      <div>
        <h2 className="mb-0 text-base">
          {capitalize(props.observation.magistrat.firstName)}{' '}
          {props.observation.magistrat.lastName.toUpperCase()}
        </h2>
        <p className="mb-2 text-sm text-gray-600">{formattedDate}</p>
      </div>

      <ObservationFollowUpSelector
        sessionId={props.sessionId}
        nominationFileId={props.nominationFileId}
        observationId={props.observation.id}
        followUp={props.observation.followUp}
        comment={props.observation.followUpComment}
        onChange={onChange}
      />
    </div>
  );
}

export function ObservationFollowUpReminderModal(props: {
  nominationFile: SessionNominationFile | null;
  onClose: () => unknown;
}) {
  const [willDrop, setWillDrop] = React.useState(true);
  const { sessionId } = useNominationFilesTable();

  useIsModalOpen(observationFollowUpCommentModal, {
    onDisclose() {
      setWillDrop(false);
      observationFollowUpReminderModal.close();
    },
    onConceal() {
      setWillDrop(true);
      observationFollowUpReminderModal.open();
    },
  });

  const [isDirty, setDirty] = React.useState<boolean>(false);
  const [observations, setObservations] = React.useState<ObservationWithFollowUp[]>([]);

  React.useEffect(() => {
    const initialObservations = (props.nominationFile?.observations ?? [])
      .filter((o): o is typeof o & { magistrat: NonNullable<(typeof o)['magistrat']> } => !!o.magistrat)
      .toSorted((a, b) => {
        if ((a.followUp && b.followUp) || (!a.followUp && !b.followUp))
          return (
            DateOnly.fromStoreModel(a.date).toDate().getTime() -
            DateOnly.fromStoreModel(b.date).toDate().getTime()
          );

        if (!a.followUp && b.followUp) return -1;
        if (!b.followUp && a.followUp) return 1;

        return 0;
      });
    setObservations(initialObservations);
    setDirty(false);
  }, [props.nominationFile]);

  useIsModalOpen(observationFollowUpReminderModal, {
    onConceal() {
      if (willDrop) {
        props.onClose();
        setObservations([]);
      }
    },
  });

  const onChange = React.useCallback(
    (observation: ObservationWithFollowUp) => {
      setDirty(true);
      setObservations((obs) => obs.map((o) => (o.id === observation.id ? observation : o)));
    },
    [setObservations],
  );

  const missingFollowUpCount = React.useMemo(
    () => observations.filter(({ followUp }) => followUp === null).length,
    [observations],
  );

  const description =
    missingFollowUpCount === 0 ? (
      <p>
        <i className={cx('fr-icon-success-line')} />
        Toutes vos descriptions ont une suite
      </p>
    ) : missingFollowUpCount > 1 ? (
      <p>{missingFollowUpCount} observations sans suite sont disponibles sur ce dossier.</p>
    ) : (
      <p>{missingFollowUpCount} observation sans suite est disponible sur ce dossier.</p>
    );

  return (
    <observationFollowUpReminderModal.Component
      title="Suite aux observations"
      buttons={[
        missingFollowUpCount === 0 || isDirty
          ? {
              children: 'Fermer',
              iconId: 'fr-icon-close-line',
              iconPosition: 'right',
              priority: 'primary',
            }
          : { children: 'Ignorer', priority: 'secondary' },
      ]}
    >
      {description}

      {observations.length > 0 ? (
        <div className="flex flex-col gap-y-2">
          {observations.map((observation) => (
            <SingleObservationWithFollowUpSelector
              key={observation.id}
              sessionId={sessionId}
              nominationFileId={props.nominationFile!.id}
              observation={observation}
              onChange={onChange}
            />
          ))}
        </div>
      ) : null}
    </observationFollowUpReminderModal.Component>
  );
}
