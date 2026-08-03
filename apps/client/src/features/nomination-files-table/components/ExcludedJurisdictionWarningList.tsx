import Alert from '@codegouvfr/react-dsfr/Alert';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  excludedJurisdictionLines,
  type ExcludedJurisdictionConflict,
} from '../context/member-excluded-jurisdictions';

function warningLines(conflicts: readonly ExcludedJurisdictionConflict[]) {
  const files = new Map<string, { conflicts: ExcludedJurisdictionConflict[]; fileNumber: number | null }>();

  for (const conflict of conflicts) {
    const file = files.get(conflict.fileId) ?? { conflicts: [], fileNumber: conflict.fileNumber };
    file.conflicts.push(conflict);
    files.set(conflict.fileId, file);
  }

  return [...files].flatMap(([fileId, file]) =>
    excludedJurisdictionLines(file.conflicts).map((line) => ({
      ...line,
      fileId,
      fileNumber: file.fileNumber,
    })),
  );
}

export function ExcludedJurisdictionWarningList(props: {
  conflicts: readonly ExcludedJurisdictionConflict[];
}) {
  const { formatList } = useIntl();
  if (props.conflicts.length === 0) return null;

  return (
    <Alert
      description={
        <ul className="fr-mb-0">
          {warningLines(props.conflicts).map(({ fileId, fileNumber, jurisdictions, memberNames }) => (
            <li key={`${fileId}_${JSON.stringify(jurisdictions)}`}>
              <FormattedMessage
                defaultMessage="Attention le dossier n° {fileNumber} est dans le périmètre {count, plural, one {d'une juridiction exclue} other {de juridictions exclues}} ({jurisdictions}) pour {memberNames}"
                values={{
                  count: jurisdictions.length,
                  fileNumber,
                  jurisdictions: formatList(jurisdictions),
                  memberNames: formatList(memberNames),
                }}
              />
            </li>
          ))}
        </ul>
      }
      severity="warning"
      small
    />
  );
}
