import { labels } from '@/constants/labels.constants';
import { reportHtmlIds } from '@/features/reports/constants/html-ids.constants';
import { formatBiography } from '@/features/reports/utils/formatters';

export function MagistratBiography(props: { historique: string | null }) {
  return (
    <div>
      <label className="fr-mb-4v block text-xl font-semibold" id={reportHtmlIds.overview.biography}>
        {labels.magistrat.biography}
      </label>
      <div
        aria-labelledby={reportHtmlIds.overview.biography}
        className="w-full leading-7 whitespace-pre-line"
      >
        {formatBiography(props.historique)}
      </div>
    </div>
  );
}
