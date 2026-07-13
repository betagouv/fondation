import Button from '@codegouvfr/react-dsfr/Button';
import Tag from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  useObservationsModal,
  type ActiveFile,
} from '../../../observations/context/ObservationsModalContext';
import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { formatObservers } from '@/features/reports/utils/formatters';
import { ObservationFollowUpEnumLabels, type ObservationFollowupEnum } from '@/types/enums.types';
import { getObservationDetailsPath } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import {
  useGetObservationFileUrlMutation,
  useObservationsQuery,
  type Observation,
} from '@queries/observations.queries';

const FOLLOW_UP_TAG_CLASS: Record<ObservationFollowupEnum, string> = {
  ALERT: 'bg-(--background-contrast-error)! text-(--text-default-error)!',
  INTERESTING: 'bg-(--background-contrast-info)! text-(--text-default-info)!',
  REFERENCE: 'bg-(--background-contrast-success)! text-(--text-default-success)!',
};

function MagistratObservationCard({ observation, file }: { observation: Observation; file: ActiveFile }) {
  const intl = useIntl();
  const isSg = useIsSgNavigation();
  const { edit, requestDelete } = useObservationsModal();
  const { mutate: getFileUrl, isPending: isLoadingFile } = useGetObservationFileUrlMutation();

  const magistratName = observation.magistrat
    ? `${observation.magistrat.lastName.toUpperCase()} ${capitalize(observation.magistrat.firstName)}`
    : intl.formatMessage({ defaultMessage: 'Magistrat inconnu' });

  const handleFileClick = (fileId: string) =>
    getFileUrl(
      {
        sessionId: file.sessionId,
        nominationFileId: file.id,
        observationId: observation.id,
        fileId,
      },
      { onSuccess: (url) => window.open(url, '_blank') },
    );

  const detailPath = getObservationDetailsPath({
    sessionId: file.sessionId,
    nominationFileId: file.id,
    observationId: observation.id,
    context: isSg ? 'sg' : 'membre',
  });
  const detailTitle = intl.formatMessage({
    defaultMessage: "Voir le détail de l'observation",
  });

  return (
    <div className="row-span-2 grid snap-start grid-rows-subgrid gap-y-0 border border-(--border-default-grey) bg-(--background-default-grey) px-6 pt-6 pb-4">
      <div className="fr-mb-4v -mx-6 -mt-6 flex flex-col items-start gap-1.5 bg-(--background-alt-grey) px-6 py-4">
        {observation.followUp && (
          <Tag
            className={`min-h-5! rounded-sm! px-1.5! py-0.5! text-[0.625rem]! font-semibold! uppercase ${FOLLOW_UP_TAG_CLASS[observation.followUp]}`}
            small
          >
            {ObservationFollowUpEnumLabels[observation.followUp]}
          </Tag>
        )}
        <div className="text-lg font-bold">{magistratName}</div>
        {observation.magistrat?.currentPosition && (
          <div className="text-xs text-(--text-mention-grey)">{observation.magistrat.currentPosition}</div>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex flex-col gap-1 text-sm-plus text-(--text-default-grey)">
          <div>
            <FormattedMessage
              defaultMessage="Reçue le {date, date, dateOnlyShort}"
              values={{ date: new Date(observation.dateReception) }}
            />
          </div>
          {observation.createdBy && (
            <div className="text-xs text-(--text-mention-grey)">
              <FormattedMessage
                defaultMessage="Saisie par {lastName} {firstName} le {date, date, dateOnlyShort}"
                values={{
                  date: new Date(observation.createdAt),
                  lastName: observation.createdBy.lastName,
                  firstName: observation.createdBy.firstName,
                }}
              />
            </div>
          )}
        </div>

        {observation.files.length > 0 && (
          <div>
            <div className="fr-mb-2v fr-text--sm fr-text--bold">
              <FormattedMessage
                defaultMessage="{count, plural, one {Pièce jointe :} other {Pièces jointes :}}"
                values={{ count: observation.files.length }}
              />
            </div>
            <ul className="fr-raw-list">
              {observation.files.map((attachment) => (
                <li key={attachment.id} className="fr-mb-2v">
                  <Button
                    priority="tertiary no outline"
                    iconId="ri-file-download-line"
                    size="small"
                    disabled={isLoadingFile}
                    onClick={() => handleFileClick(attachment.id)}
                  >
                    {attachment.name}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="fr-pt-3v mt-auto -mr-2 flex justify-end gap-1">
          <Button
            iconId="ri-eye-line"
            linkProps={{ to: detailPath }}
            priority="tertiary no outline"
            size="small"
            title={detailTitle}
          />
          {isSg && (
            <>
              <Button
                iconId="ri-edit-line"
                onClick={() => edit(observation, file)}
                priority="tertiary no outline"
                size="small"
                title={intl.formatMessage({
                  defaultMessage: "Éditer l'observation",
                })}
              />
              <Button
                iconId="ri-delete-bin-line"
                onClick={() => requestDelete(observation, file)}
                priority="tertiary no outline"
                size="small"
                title={intl.formatMessage({
                  defaultMessage: "Supprimer l'observation",
                })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function MagistratObservations({
  nominationFile,
  sessionId,
}: {
  nominationFile: SessionNominationFile;
  sessionId: string;
}) {
  const intl = useIntl();
  const isSg = useIsSgNavigation();
  const { open } = useObservationsModal();
  const { observants } = nominationFile.content;

  const { data } = useObservationsQuery({
    sessionId,
    nominationFileId: nominationFile.id,
  });
  const observations = data?.observations ?? [];
  const isScrollable = observations.length > 2;

  const scroller = useRef<HTMLDivElement>(null);
  const [{ atStart, atEnd }, setEdges] = useState({ atStart: true, atEnd: true });

  const refreshEdges = () => {
    const element = scroller.current;
    if (!element) return;
    setEdges({
      atStart: element.scrollLeft <= 0,
      atEnd: Math.ceil(element.scrollLeft + element.clientWidth) >= element.scrollWidth,
    });
  };

  useEffect(refreshEdges, [observations.length]);

  const scrollByCard = (direction: 1 | -1) =>
    scroller.current?.scrollBy({
      left: direction * scroller.current.clientWidth * 0.5,
      behavior: 'smooth',
    });

  const file: ActiveFile = {
    sessionId,
    id: nominationFile.id,
    name: nominationFile.content.nomMagistrat,
  };
  const formattedObservers = observants ? formatObservers(observants) : null;
  const observersCount = (observants?.length ?? 0) + observations.length;

  if (!isSg && observersCount === 0) return null;

  return (
    <div>
      <div className="fr-mb-4v flex items-center justify-between gap-2">
        <h3 className="fr-mb-0 text-xl font-semibold">
          <FormattedMessage
            defaultMessage="{count, plural, one {Observant} other {Observants}}"
            values={{ count: observersCount }}
          />
        </h3>
        <div className="flex items-center gap-1">
          {isScrollable && (
            <>
              <Button
                disabled={atStart}
                iconId="fr-icon-arrow-left-s-line"
                onClick={() => scrollByCard(-1)}
                priority="tertiary"
                size="small"
                title={intl.formatMessage({ defaultMessage: 'Observations précédentes' })}
              />
              <Button
                className="fr-mr-1v"
                disabled={atEnd}
                iconId="fr-icon-arrow-right-s-line"
                onClick={() => scrollByCard(1)}
                priority="tertiary"
                size="small"
                title={intl.formatMessage({ defaultMessage: 'Observations suivantes' })}
              />
            </>
          )}
          {isSg && (
            <Button
              className="btn-compact"
              onClick={() => open(file, 'create')}
              priority="secondary"
              size="small"
            >
              <FormattedMessage defaultMessage="Ajouter" />
            </Button>
          )}
        </div>
      </div>

      {formattedObservers && (
        <ul className="fr-raw-list fr-mt-2v fr-mb-5v flex flex-wrap gap-2">
          {formattedObservers.map((observer, index) => (
            <li key={`${observer}-${index}`}>
              <Tag small>{observer}</Tag>
            </li>
          ))}
        </ul>
      )}

      {observations.length > 0 && (
        <div
          aria-label={intl.formatMessage({ defaultMessage: 'Observations reçues' })}
          className={clsx(
            'fr-mt-2v grid grid-rows-[auto_1fr] gap-4',
            isScrollable
              ? 'snap-x scrollbar-none auto-cols-[85%] grid-flow-col overflow-x-auto md:auto-cols-[46%]'
              : 'grid-cols-1 md:grid-cols-2',
          )}
          onScroll={refreshEdges}
          ref={scroller}
          role="group"
          tabIndex={isScrollable ? 0 : undefined}
        >
          {observations.map((observation) => (
            <MagistratObservationCard key={observation.id} observation={observation} file={file} />
          ))}
        </div>
      )}

      {!formattedObservers && observations.length === 0 && (
        <div className="fr-mt-2v w-full leading-7 whitespace-pre-line text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="Aucun observant sur cette proposition" />
        </div>
      )}
    </div>
  );
}
