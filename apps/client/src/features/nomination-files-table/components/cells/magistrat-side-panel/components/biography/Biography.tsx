import { FormattedMessage } from 'react-intl';

import { reportHtmlIds } from '@/features/reports/constants/html-ids.constants';
import { BiographyList } from '@/shared/components/biography-list';

export function Biography(props: { historique: string | null }) {
  return (
    <div>
      <h3 className="fr-mb-4v text-xl font-semibold" id={reportHtmlIds.overview.biography}>
        <FormattedMessage defaultMessage="Biographie" />
      </h3>
      <div aria-labelledby={reportHtmlIds.overview.biography} className="w-full">
        {props.historique?.trim() ? (
          <BiographyList biography={props.historique} />
        ) : (
          <p className="fr-mb-0 text-(--text-mention-grey)">
            <FormattedMessage defaultMessage="Aucune biographie" />
          </p>
        )}
      </div>
    </div>
  );
}
