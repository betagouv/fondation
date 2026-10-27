import Alert from '@codegouvfr/react-dsfr/Alert';
import { FormattedMessage, useIntl } from 'react-intl';

import { type HelpPageEnum, useHelpPageQuery } from '@queries/help.queries';

import { HelpPageContent } from './HelpPageContent';

/** an emptied editor leaves an empty paragraph behind */
function isBlank(content: string): boolean {
  const { body } = new DOMParser().parseFromString(content, 'text/html');
  return !body.textContent?.trim() && !body.querySelector('img, table, hr, video');
}

export function HelpPageArticle(props: { page: HelpPageEnum }) {
  const { formatMessage } = useIntl();
  const { data, isError } = useHelpPageQuery({ page: props.page });

  if (isError) {
    return (
      <Alert
        description={formatMessage({ defaultMessage: "La page d'aide n'a pas pu être chargée." })}
        severity="error"
        small
      />
    );
  }

  if (!data) return null;

  if (isBlank(data.content)) {
    return (
      <p className="fr-text--sm fr-mb-0 italic">
        <FormattedMessage defaultMessage="Cette page n'a pas encore de contenu." />
      </p>
    );
  }

  return <HelpPageContent content={data.content} />;
}
