import { FormattedMessage } from 'react-intl';

import { memberFullName } from '@/utils/user.utils';

import { propositionLabel, type RecusedReporter } from './recused-reporters';

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
            {`${memberFullName(reporter)} : ${files.map(propositionLabel).join(', ')}`}
          </li>
        ))}
      </ul>
    </>
  );
}
