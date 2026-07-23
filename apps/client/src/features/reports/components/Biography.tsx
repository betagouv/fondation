import { labels } from '@/constants/labels.constants';
import { reportHtmlIds } from '@/features/reports/constants/html-ids.constants';
import { BiographyList } from '@/shared/components/biography-list';

import { Card } from './Card';

export function Biography(props: { biography: string | null }) {
  return (
    <Card id={reportHtmlIds.overview.biographySection}>
      <h2 id={reportHtmlIds.overview.biography}>{labels.magistrat.biography}</h2>
      <div aria-labelledby={reportHtmlIds.overview.biography} className="w-full">
        {props.biography ? <BiographyList biography={props.biography} /> : null}
      </div>
    </Card>
  );
}
