import { FormattedMessage } from 'react-intl';

import { reportHtmlIds } from '@/features/reports/constants/html-ids.constants';
import { BiographyList } from '@/shared/components/biography-list';

export function Biography(props: { historique: string | null }) {
  return (
    <div>
      <label className="fr-mb-4v block text-xl font-semibold" id={reportHtmlIds.overview.biography}>
        <FormattedMessage defaultMessage="Biographie" />
      </label>
      <div aria-labelledby={reportHtmlIds.overview.biography} className="w-full">
        {props.historique ? <BiographyList biography={props.historique} /> : null}
      </div>
    </div>
  );
}
