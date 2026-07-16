import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage, useIntl } from 'react-intl';

import { getObservationDetailsPath } from '@/utils/route-path.utils';
import { toFullName } from '@/utils/user.utils';
import {
  useGetObservationFileUrlMutation,
  useObservationsQuery,
  type Observation,
} from '@queries/observations.queries';

function ObservationCard(props: {
  nominationFileId: string;
  observation: Observation;
  onEdit: (observation: Observation) => void;
  onRequestDelete: (observation: Observation) => void;
  sessionId: string;
}) {
  const intl = useIntl();
  const { mutate: getFileUrl, isPending: isLoadingFile } = useGetObservationFileUrlMutation();

  const handleFileClick = (fileId: string) => {
    getFileUrl(
      {
        fileId,
        nominationFileId: props.nominationFileId,
        observationId: props.observation.id,
        sessionId: props.sessionId,
      },
      { onSuccess: (url) => window.open(url, '_blank') },
    );
  };

  return (
    <div className="fr-p-4v rounded-sm border bg-(--background-default-grey) shadow-xs">
      <div className="fr-mb-2v flex items-start justify-between">
        <div>
          <div className="text-sm text-(--text-mention-grey)">
            <FormattedMessage
              defaultMessage="Reçue le {date, date, dateOnlyShort}"
              values={{ date: new Date(props.observation.dateReception) }}
            />
          </div>
          {props.observation.magistrat && (
            <div className="font-medium">
              <FormattedMessage
                defaultMessage="Observant : {name}"
                values={{
                  name: [
                    `${props.observation.magistrat.lastName} ${props.observation.magistrat.firstName}`,
                    props.observation.magistrat.currentPosition,
                  ]
                    .filter(Boolean)
                    .join(' - '),
                }}
              />
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            iconId="ri-file-text-line"
            linkProps={{
              to: getObservationDetailsPath({
                context: 'sg',
                nominationFileId: props.nominationFileId,
                observationId: props.observation.id,
                sessionId: props.sessionId,
              }),
            }}
            priority="tertiary no outline"
            size="small"
            title={
              props.observation.magistrat
                ? intl.formatMessage(
                    { defaultMessage: "Voir le détail de l'observation par {name}" },
                    { name: toFullName(props.observation.magistrat) },
                  )
                : intl.formatMessage({ defaultMessage: "Voir le détail de l'observation" })
            }
          />
          <Button
            iconId="ri-edit-line"
            onClick={() => props.onEdit(props.observation)}
            priority="tertiary no outline"
            size="small"
            title={intl.formatMessage({ defaultMessage: 'Éditer' })}
          />
          <Button
            iconId="ri-delete-bin-line"
            onClick={() => props.onRequestDelete(props.observation)}
            priority="tertiary no outline"
            size="small"
            title={intl.formatMessage({ defaultMessage: 'Supprimer' })}
          />
        </div>
      </div>

      {props.observation.files.length > 0 && (
        <div className="fr-mt-3v fr-pt-3v border-t">
          <div className="fr-mb-2v fr-text--sm fr-text--bold">
            <FormattedMessage defaultMessage="Pièces jointes:" />
          </div>
          <ul className="fr-raw-list">
            {props.observation.files.map((file) => (
              <li key={file.id} className="fr-mb-2v">
                <Button
                  disabled={isLoadingFile}
                  iconId="ri-file-download-line"
                  onClick={() => handleFileClick(file.id)}
                  priority="tertiary no outline"
                  size="small"
                >
                  {file.name}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {props.observation.createdBy && (
        <div className="fr-mt-3v text-xs text-(--text-disabled-grey)">
          <FormattedMessage
            defaultMessage="Créée par {name} le {date, date, dateOnlyShort}"
            values={{
              date: new Date(props.observation.createdAt),
              name: `${props.observation.createdBy.lastName} ${props.observation.createdBy.firstName}`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ObservationsList(props: {
  nominationFileId: string;
  onAdd: () => void;
  onEdit: (observation: Observation) => void;
  onRequestDelete: (observation: Observation) => void;
  sessionId: string;
}) {
  const intl = useIntl();
  const { data, isLoading } = useObservationsQuery({
    nominationFileId: props.nominationFileId,
    sessionId: props.sessionId,
  });

  const observations = data?.observations ?? [];

  return (
    <div className="fr-mt-6v">
      <div className="fr-mb-4v flex items-center justify-between">
        <h2 className="fr-mb-0 text-xl font-semibold">
          <FormattedMessage defaultMessage="Observations ({count})" values={{ count: observations.length }} />
        </h2>
        <Button
          iconId="ri-add-line"
          onClick={props.onAdd}
          priority="primary"
          size="small"
          title={intl.formatMessage({ defaultMessage: 'Ajouter une observation' })}
        />
      </div>

      {isLoading ? (
        <div className="text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="Chargement..." />
        </div>
      ) : observations.length === 0 ? (
        <div className="fr-p-4v rounded-sm bg-(--background-alt-grey) text-center text-(--text-mention-grey)">
          <FormattedMessage defaultMessage="Aucune observation pour ce dossier" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {observations.map((observation) => (
            <ObservationCard
              key={observation.id}
              nominationFileId={props.nominationFileId}
              observation={observation}
              onEdit={props.onEdit}
              onRequestDelete={props.onRequestDelete}
              sessionId={props.sessionId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
