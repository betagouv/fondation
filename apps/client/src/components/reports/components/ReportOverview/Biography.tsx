import { reportHtmlIds } from '../../dom/html-ids';
import { labels } from '@/constants/labels.constants';

import { Card } from './Card';

export type BiographyProps = {
  biography: string | null;
};

export const Biography: React.FC<BiographyProps> = ({ biography }) => (
  <Card id={reportHtmlIds.overview.biographySection}>
    <h2 id={reportHtmlIds.overview.biography}>{labels.magistrat.biography}</h2>
    <div aria-labelledby={reportHtmlIds.overview.biography} className="w-full leading-10 whitespace-pre-line">
      {biography}
    </div>
  </Card>
);
