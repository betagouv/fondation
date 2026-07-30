import Button from '@codegouvfr/react-dsfr/Button';
import Tag from '@codegouvfr/react-dsfr/Tag';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router';

import {
  useObservationsModal,
  type ActiveFile,
} from '../../../observations/context/ObservationsModalContext';
import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { formatObservers } from '@/features/reports/utils/formatters';
import { ObservationFollowUpEnumLabels, type ObservationFollowupEnum } from '@/types/enums.types';
import { getObservationDetailsPath } from '@/utils/route-path.utils';
import { fullNameUpperCase } from '@/utils/user.utils';
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

const VISIBLE_OBSERVATIONS = 3;

function ObservationCard({ observation, file }: { observation: Observation; file: ActiveFile }) {
  const intl = useIntl();
  const isSg = useIsSgNavigation();
  const { edit, requestDelete } = useObservationsModal();
  const { mutate: getFileUrl, isPending: isLoadingFile } = useGetObservationFileUrlMutation();
  const [expanded, setExpanded] = useState(false);

  const fileCount = observation.files.length;
  const hasFiles = fileCount > 0;
  const hasDescription = !!observation.description?.trim();
  const isExpandable = hasFiles || hasDescription;
  const showHeadings = hasFiles && hasDescription;
  const panelId = `observation-details-${observation.id}`;

  const toggleLabel =
    hasDescription && hasFiles
      ? intl.formatMessage(
          {
            defaultMessage:
              "Voir le texte de l'observation et {count, plural, one {la pièce jointe} other {les # pièces jointes}}",
          },
          { count: fileCount },
        )
      : hasDescription
        ? intl.formatMessage({ defaultMessage: "Voir le texte de l'observation" })
        : intl.formatMessage(
            {
              defaultMessage: '{count, plural, one {Voir la pièce jointe} other {Voir les # pièces jointes}}',
            },
            { count: fileCount },
          );

  const magistratName = observation.magistrat
    ? fullNameUpperCase(observation.magistrat)
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
    <li className="border border-(--border-default-grey) bg-(--background-default-grey)">
      <div className="flex flex-col gap-1.5 p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="-my-0.5 w-fit py-0.5 text-base font-bold text-(--text-action-high-blue-france) hover:bg-(--background-default-grey-hover) hover:[--underline-hover-width:0]"
                title={detailTitle}
                to={detailPath}
              >
                {magistratName}
              </Link>
              {observation.followUp && (
                <Tag
                  className={`min-h-5! rounded-sm! px-1.5! py-0.5! text-[0.625rem]! leading-none! font-semibold! uppercase ${FOLLOW_UP_TAG_CLASS[observation.followUp]}`}
                  small
                >
                  {ObservationFollowUpEnumLabels[observation.followUp]}
                </Tag>
              )}
            </div>
            {observation.magistrat?.currentPosition && (
              <div className="fr-mt-1v text-xs text-(--text-mention-grey)">
                {observation.magistrat.currentPosition}
              </div>
            )}
          </div>
          {isSg && (
            <div className="-mr-2 flex shrink-0 gap-1">
              <Button
                iconId="ri-edit-line"
                onClick={() => edit(observation, file)}
                priority="tertiary no outline"
                size="small"
                title={intl.formatMessage({ defaultMessage: "Éditer l'observation" })}
              />
              <Button
                iconId="ri-delete-bin-line"
                onClick={() => requestDelete(observation, file)}
                priority="tertiary no outline"
                size="small"
                title={intl.formatMessage({ defaultMessage: "Supprimer l'observation" })}
              />
            </div>
          )}
        </div>

        <div className="fr-mt-2v flex items-center justify-between gap-2">
          <span className="text-sm-plus text-(--text-default-grey)">
            <FormattedMessage
              defaultMessage="Reçue le {date, date, dateOnlyShort}"
              values={{ date: new Date(observation.dateReception) }}
            />
          </span>
          {isExpandable && (
            <Button
              aria-controls={panelId}
              aria-expanded={expanded}
              className="-mr-3 [&::after]:ml-1!"
              iconId={expanded ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'}
              iconPosition="right"
              onClick={() => setExpanded((value) => !value)}
              priority="tertiary no outline"
              size="small"
            >
              {toggleLabel}
            </Button>
          )}
        </div>

        {isExpandable && expanded && (
          <div className="fr-mt-1v flex flex-col gap-4 py-3" id={panelId}>
            {hasDescription && (
              <div>
                {showHeadings && (
                  <div className="fr-mb-1v fr-text--sm fr-text--bold">
                    <FormattedMessage defaultMessage="Texte de l'observation :" />
                  </div>
                )}
                <p className="fr-mb-0 text-sm-plus whitespace-pre-line text-(--text-default-grey)">
                  {observation.description}
                </p>
              </div>
            )}
            {hasFiles && (
              <div>
                {showHeadings && (
                  <div className="fr-mb-1v fr-text--sm fr-text--bold">
                    <FormattedMessage
                      defaultMessage="{count, plural, one {Pièce jointe :} other {Pièces jointes :}}"
                      values={{ count: fileCount }}
                    />
                  </div>
                )}
                <ul className="fr-raw-list flex flex-col items-start">
                  {observation.files.map((attachment) => (
                    <li key={attachment.id}>
                      <Button
                        className="px-0! underline underline-offset-3 before:no-underline [&::before]:mr-1!"
                        disabled={isLoadingFile}
                        iconId="ri-file-text-line"
                        onClick={() => handleFileClick(attachment.id)}
                        priority="tertiary no outline"
                        size="small"
                      >
                        {attachment.name}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function Observations({
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

  const [showAll, setShowAll] = useState(false);
  const { data } = useObservationsQuery({
    sessionId,
    nominationFileId: nominationFile.id,
  });
  const observations = data?.observations ?? [];
  const visibleObservations = showAll ? observations : observations.slice(0, VISIBLE_OBSERVATIONS);
  const hiddenCount = observations.length - visibleObservations.length;

  const file: ActiveFile = {
    sessionId,
    id: nominationFile.id,
    name: nominationFile.content.nomMagistrat,
  };
  const formattedObservers = observants ? formatObservers(observants) : null;
  const observationsCount = observations.length;

  if (!isSg && observationsCount === 0 && !formattedObservers) return null;

  return (
    <div>
      <div className="fr-mb-4v flex items-center justify-between gap-2">
        <h3 className="fr-mb-0 text-xl font-semibold">
          <FormattedMessage
            defaultMessage="{count, plural, =0 {Observants} one {Observant (1)} other {Observants ({count})}}"
            values={{ count: observationsCount }}
          />
        </h3>
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
        <ul
          aria-label={intl.formatMessage({ defaultMessage: 'Observations reçues' })}
          className="fr-raw-list fr-mt-2v flex flex-col gap-4"
        >
          {visibleObservations.map((observation) => (
            <ObservationCard key={observation.id} observation={observation} file={file} />
          ))}
        </ul>
      )}

      {hiddenCount > 0 && (
        <Button
          className="fr-mt-3v btn-compact"
          iconId="fr-icon-arrow-down-s-line"
          iconPosition="right"
          onClick={() => setShowAll(true)}
          priority="tertiary"
          size="small"
        >
          <FormattedMessage defaultMessage="Afficher plus ({count})" values={{ count: hiddenCount }} />
        </Button>
      )}

      {!formattedObservers && observations.length === 0 && (
        <div className="fr-mt-2v w-full leading-7 whitespace-pre-line text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="Aucun observant sur cette proposition" />
        </div>
      )}
    </div>
  );
}
