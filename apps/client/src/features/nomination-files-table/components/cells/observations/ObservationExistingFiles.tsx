import { FormattedMessage, useIntl } from 'react-intl';

import type { Observation } from '@queries/observations.queries';

export function ObservationExistingFiles(props: {
  files: Observation['files'];
  detachedFiles: Observation['files'];
  onRemove: (fileId: string) => void;
}) {
  const intl = useIntl();

  return (
    <div>
      <label className="fr-label fr-mb-2v block">
        <FormattedMessage
          defaultMessage={`{count, plural,
            one {Fichier existant}
            other {Fichiers existants}
          }`}
          values={{ count: props.files.length }}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {props.files.map((file) => (
          <div
            className="fr-px-3v fr-py-2v flex items-center gap-2 rounded-sm bg-(--background-contrast-grey)"
            key={file.id}
          >
            <i className="ri-file-line" />
            <span className="text-sm">{file.name}</span>
            <button
              className="fr-ml-2v text-(--text-default-error) hover:text-(--text-default-error)"
              onClick={() => props.onRemove(file.id)}
              title={intl.formatMessage({ defaultMessage: 'Supprimer {name}' }, { name: file.name })}
              type="button"
            >
              <i className="ri-close-line" />
            </button>
          </div>
        ))}
      </div>

      {props.detachedFiles.length > 0 && (
        <div className="fr-mt-2v text-sm text-(--text-default-warning)">
          <FormattedMessage
            defaultMessage={`{count, plural,
              one {1 fichier sera supprimé}
              other {{count} fichiers seront supprimés}
            }`}
            values={{ count: props.detachedFiles.length }}
          />
        </div>
      )}
    </div>
  );
}
