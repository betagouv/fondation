import Button from '@codegouvfr/react-dsfr/Button';
import Tag from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';
import { useState, type KeyboardEvent } from 'react';
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

const tabId = (observationId: string) => `observation-tab-${observationId}`;
const panelId = (observationId: string) => `observation-panel-${observationId}`;

function observantName(observation: Observation, unknownLabel: string) {
  return observation.magistrat
    ? `${observation.magistrat.lastName.toUpperCase()} ${capitalize(observation.magistrat.firstName)}`
    : unknownLabel;
}

function FollowUpTag({ followUp }: { followUp: ObservationFollowupEnum }) {
  return (
    <Tag
      className={`min-h-5! rounded-sm! px-1.5! py-0.5! text-[0.625rem]! font-semibold! uppercase ${FOLLOW_UP_TAG_CLASS[followUp]}`}
      small
    >
      {ObservationFollowUpEnumLabels[followUp]}
    </Tag>
  );
}

function ObservationReader({ file, observation }: { file: ActiveFile; observation: Observation }) {
  const intl = useIntl();
  const isSg = useIsSgNavigation();
  const { edit, requestDelete } = useObservationsModal();
  const { mutate: getFileUrl, isPending: isLoadingFile } = useGetObservationFileUrlMutation();

  const handleFileClick = (fileId: string) =>
    getFileUrl(
      { sessionId: file.sessionId, nominationFileId: file.id, observationId: observation.id, fileId },
      { onSuccess: (url) => window.open(url, '_blank') },
    );

  const detailPath = getObservationDetailsPath({
    sessionId: file.sessionId,
    nominationFileId: file.id,
    observationId: observation.id,
    context: isSg ? 'sg' : 'membre',
  });

  const isEmpty = !observation.description && observation.files.length === 0;

  return (
    <article
      aria-label={intl.formatMessage(
        { defaultMessage: 'Observation de {name}' },
        {
          name: observantName(observation, intl.formatMessage({ defaultMessage: 'Magistrat inconnu' })),
        },
      )}
      className="fr-p-6v flex w-full flex-col gap-3"
    >
      <header className="flex items-center justify-between gap-6">
        {observation.createdBy && !isEmpty && (
          <div className="min-w-0 text-xs text-(--text-mention-grey)">
            <FormattedMessage
              defaultMessage="Fiche créée le {date, date, dateOnlyShort} par {lastName} {firstName}"
              values={{
                date: new Date(observation.createdAt),
                lastName: observation.createdBy.lastName,
                firstName: observation.createdBy.firstName,
              }}
            />
          </div>
        )}

        <div className="-mr-2 ml-auto flex shrink-0 gap-0.5">
          <Button
            iconId="ri-eye-line"
            linkProps={{ to: detailPath }}
            priority="tertiary no outline"
            size="small"
            title={intl.formatMessage({ defaultMessage: "Voir le détail de l'observation" })}
          />
          {isSg && (
            <>
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
            </>
          )}
        </div>
      </header>

      {isEmpty && (
        <p className="fr-mb-0 flex flex-1 items-center justify-center pb-10 text-center text-sm-plus text-(--text-mention-grey) italic">
          <FormattedMessage defaultMessage="Aucun contenu transmis pour cette observation" />
        </p>
      )}

      {observation.description && (
        <p className="fr-mb-0 text-sm-plus whitespace-pre-line text-(--text-default-grey)">
          {observation.description}
        </p>
      )}

      {observation.files.length > 0 && (
        <div className="fr-pt-4v border-t border-(--border-default-grey)">
          <div className="fr-mb-2v fr-text--sm fr-text--bold">
            <FormattedMessage
              defaultMessage="{count, plural, one {Pièce jointe :} other {Pièces jointes :}}"
              values={{ count: observation.files.length }}
            />
          </div>
          <ul className="fr-raw-list flex flex-col items-start">
            {observation.files.map((attachment) => (
              <li key={attachment.id}>
                <Button
                  className="px-0!"
                  disabled={isLoadingFile}
                  iconId="ri-attachment-2"
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
    </article>
  );
}

export function MagistratObservationsInbox({
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

  const { data } = useObservationsQuery({ sessionId, nominationFileId: nominationFile.id });
  const observations = data?.observations ?? [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = observations.find((observation) => observation.id === selectedId) ?? observations[0];

  const selectWithArrows = (event: KeyboardEvent<HTMLDivElement>) => {
    const STEPS: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    const current = observations.findIndex((observation) => observation.id === selected?.id);

    const target =
      event.key === 'Home'
        ? observations[0]
        : event.key === 'End'
          ? observations.at(-1)
          : event.key in STEPS
            ? observations[(current + STEPS[event.key]! + observations.length) % observations.length]
            : undefined;

    if (!target) return;

    event.preventDefault();
    setSelectedId(target.id);
    document.getElementById(tabId(target.id))?.focus();
  };

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

      {selected && (
        <div className="fr-mt-2v grid grid-cols-1 border border-(--border-default-grey) bg-(--background-default-grey) md:grid-cols-[fit-content(22rem)_1fr]">
          <div
            aria-label={intl.formatMessage({ defaultMessage: 'Observations reçues' })}
            aria-orientation="vertical"
            className="grid auto-rows-fr border-b border-(--border-default-grey) md:min-w-64 md:border-r md:border-b-0"
            onKeyDown={selectWithArrows}
            role="tablist"
          >
            {observations.map((observation) => {
              const isSelected = observation.id === selected.id;
              return (
                <button
                  aria-controls={panelId(observation.id)}
                  aria-selected={isSelected}
                  className={clsx(
                    'flex h-full min-h-24 w-full flex-col items-start justify-center gap-2 border-b border-(--border-default-grey) px-4 py-3 text-left',
                    isSelected ? 'bg-(--background-alt-blue-france)' : 'bg-(--background-default-grey)',
                  )}
                  id={tabId(observation.id)}
                  key={observation.id}
                  onClick={() => setSelectedId(observation.id)}
                  role="tab"
                  tabIndex={isSelected ? 0 : -1}
                  type="button"
                >
                  {observation.followUp && (
                    <span className="fr-mb-2v">
                      <FollowUpTag followUp={observation.followUp} />
                    </span>
                  )}
                  <span className="line-clamp-2 w-full text-base font-bold wrap-break-word">
                    {observantName(observation, intl.formatMessage({ defaultMessage: 'Magistrat inconnu' }))}
                  </span>
                  {observation.magistrat?.currentPosition && (
                    <span className="line-clamp-2 text-xs leading-5 text-(--text-mention-grey)">
                      {observation.magistrat.currentPosition}
                    </span>
                  )}
                  <span className="fr-mt-2v flex items-center gap-2 text-sm text-(--text-default-grey)">
                    <FormattedMessage
                      defaultMessage="Reçue le {date, date, dateOnlyShort}"
                      values={{ date: new Date(observation.dateReception) }}
                    />
                    {observation.description && (
                      <>
                        <i
                          aria-hidden
                          className="ri-message-3-line flex items-center text-(--text-mention-grey) before:block before:size-4! before:content-['']"
                        />
                        <span className="fr-sr-only">
                          <FormattedMessage defaultMessage="Contient un texte" />
                        </span>
                      </>
                    )}
                    {observation.files.length > 0 && (
                      <>
                        <i
                          aria-hidden
                          className="ri-attachment-2 flex items-center text-(--text-mention-grey) before:block before:size-4! before:content-['']"
                        />
                        <span className="fr-sr-only">
                          <FormattedMessage defaultMessage="Contient une pièce jointe" />
                        </span>
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid">
            {observations.map((observation) => {
              const isSelected = observation.id === selected.id;
              return (
                <div
                  aria-labelledby={tabId(observation.id)}
                  className={clsx('col-start-1 row-start-1 flex', !isSelected && 'invisible')}
                  id={panelId(observation.id)}
                  inert={!isSelected}
                  key={observation.id}
                  role="tabpanel"
                  tabIndex={isSelected ? 0 : -1}
                >
                  <ObservationReader file={file} observation={observation} />
                </div>
              );
            })}
          </div>
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
