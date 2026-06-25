import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router';

import { useObservationsModal, type ActiveFile } from '../../../observations/ObservationsModalContext';
import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { formatObservers } from '@/features/reports/utils/formatters';
import { getObservationDetailsPath } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import {
  useGetObservationFileUrlMutation,
  useObservationsQuery,
  type Observation,
} from '@queries/observations.queries';

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
      { sessionId: file.sessionId, nominationFileId: file.id, observationId: observation.id, fileId },
      { onSuccess: (url) => window.open(url, '_blank') },
    );

  const detailPath = getObservationDetailsPath({
    sessionId: file.sessionId,
    nominationFileId: file.id,
    observationId: observation.id,
    context: isSg ? 'sg' : 'membre',
  });
  const detailTitle = intl.formatMessage({ defaultMessage: 'Voir le détail' });

  return (
    <div
      className={clsx(
        'relative flex flex-col border border-(--border-default-grey) bg-(--background-default-grey)',
        'px-6 pt-6',
        isSg ? 'pb-16' : 'pb-6',
      )}
    >
      <div className="fr-mb-3v text-lg font-bold">
        <Link to={detailPath} title={detailTitle} className="bg-none! text-(--text-action-high-blue-france)">
          {magistratName}
        </Link>
        {observation.magistrat?.currentPosition && (
          <span className="font-normal"> ({observation.magistrat.currentPosition})</span>
        )}
      </div>
      <div className="text-sm text-(--text-mention-grey)">
        <FormattedMessage
          defaultMessage="Observation reçue le {date, date, dateOnlyShort}"
          values={{ date: new Date(observation.dateReception) }}
        />
      </div>

      {observation.files.length > 0 && (
        <div className="fr-mt-3v fr-pt-3v border-t">
          <div className="fr-mb-2v fr-text--sm fr-text--bold">
            <FormattedMessage defaultMessage="Pièces jointes :" />
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

      {observation.createdBy && (
        <div className="fr-mt-3v text-xs text-(--text-disabled-grey)">
          <FormattedMessage
            defaultMessage="Saisie par {lastName} {firstName} le {date, date, dateOnlyShort}"
            values={{
              lastName: observation.createdBy.lastName,
              firstName: observation.createdBy.firstName,
              date: new Date(observation.createdAt),
            }}
          />
        </div>
      )}

      {isSg && (
        <div className="absolute right-4 bottom-4 flex gap-1">
          <Button
            iconId="ri-edit-line"
            priority="tertiary no outline"
            size="small"
            title={intl.formatMessage({ defaultMessage: 'Éditer' })}
            onClick={() => edit(observation, file)}
          />
          <Button
            iconId="ri-delete-bin-line"
            priority="tertiary no outline"
            size="small"
            title={intl.formatMessage({ defaultMessage: 'Supprimer' })}
            onClick={() => requestDelete(observation, file)}
          />
        </div>
      )}
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
  const isSg = useIsSgNavigation();
  const { open } = useObservationsModal();
  const { observants } = nominationFile.content;

  const { data } = useObservationsQuery({ sessionId, nominationFileId: nominationFile.id });
  const observations = data?.observations ?? [];

  const file: ActiveFile = { sessionId, id: nominationFile.id, name: nominationFile.content.nomMagistrat };
  const formattedObservers = observants ? formatObservers(observants) : null;
  const observersCount = (observants?.length ?? 0) + observations.length;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="fr-mb-0 text-xl font-semibold">
          <FormattedMessage
            defaultMessage="{count, plural, one {Observant} other {Observants}}"
            values={{ count: observersCount }}
          />
        </h3>
        {isSg && (
          <Button onClick={() => open(file, 'create')} priority="secondary" size="small">
            <FormattedMessage defaultMessage="Ajouter" />
          </Button>
        )}
      </div>

      {formattedObservers && <div className="w-full leading-7 whitespace-pre-line">{formattedObservers}</div>}

      {observations.length > 0 && (
        <div className={clsx('grid grid-cols-1 gap-4 md:grid-cols-2', 'fr-mt-2v')}>
          {observations.map((observation) => (
            <MagistratObservationCard key={observation.id} observation={observation} file={file} />
          ))}
        </div>
      )}

      {!formattedObservers && observations.length === 0 && (
        <div className="w-full leading-7 whitespace-pre-line">
          <FormattedMessage defaultMessage="Aucun" />
        </div>
      )}
    </div>
  );
}
