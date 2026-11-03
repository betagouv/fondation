import { FormattedMessage } from 'react-intl';

import { memberFullName } from '@/utils/user.utils';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

type RecusedReporter = {
  files: readonly SessionNominationFile[];
  reporter: SessionNominationFile['reporters'][number];
};

export function recusedReporters(
  files: readonly SessionNominationFile[],
  addedMemberIds: readonly string[],
): RecusedReporter[] {
  return addedMemberIds.flatMap((memberId) => {
    const reported = files.filter(
      (file) =>
        file.reporters.some(({ id }) => id === memberId) &&
        !file.recusedMembers?.some(({ id }) => id === memberId),
    );
    const reporter = reported[0]?.reporters.find(({ id }) => id === memberId);

    return reporter ? [{ files: reported, reporter }] : [];
  });
}

export function RecusedReportersNotice(props: { reporters: readonly RecusedReporter[] }) {
  const reportCount = props.reporters.reduce((count, { files }) => count + files.length, 0);

  return (
    <>
      <p>
        {props.reporters.length > 1 ? (
          <FormattedMessage
            defaultMessage={`Ces membres sont rapporteurs de dossiers sélectionnés. Avec ce déport, leurs rapports sur ces dossiers passent à « Sans objet » et en lecture seule.`}
          />
        ) : reportCount > 1 ? (
          <FormattedMessage
            defaultMessage={`Ce membre est rapporteur de dossiers sélectionnés. Avec ce déport, ses rapports sur ces dossiers passent à « Sans objet » et en lecture seule.`}
          />
        ) : (
          <FormattedMessage
            defaultMessage={`Ce membre est rapporteur d'un dossier sélectionné. Avec ce déport, son rapport sur ce dossier passe à « Sans objet » et en lecture seule.`}
          />
        )}
      </p>
      <ul>
        {props.reporters.map(({ files, reporter }) => (
          <li key={reporter.id}>
            {`${memberFullName(reporter)} : ${files.map((file) => file.content.nomMagistrat).join(', ')}`}
          </li>
        ))}
      </ul>
    </>
  );
}
