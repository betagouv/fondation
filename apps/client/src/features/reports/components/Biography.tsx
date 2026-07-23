import { labels } from '@/constants/labels.constants';
import { reportHtmlIds } from '@/features/reports/constants/html-ids.constants';
import { BiographyList } from '@/shared/components/biography-list';

import { Card } from './Card';

export type BiographyProps = {
  biography: string | null;
};

export const Biography: React.FC<BiographyProps> = ({ biography }) => (
  <Card id={reportHtmlIds.overview.biographySection}>
    <h2 id={reportHtmlIds.overview.biography}>{labels.magistrat.biography}</h2>
    <div aria-labelledby={reportHtmlIds.overview.biography} className="w-full">
      {biography ? <BiographyList biography={biography} /> : null}
    </div>
  </Card>
);
