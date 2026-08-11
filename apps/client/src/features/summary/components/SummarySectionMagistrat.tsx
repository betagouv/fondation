import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useSummary } from '@/features/summary/context/SummaryContext';
import { FormattedPositionDuration } from '@/i18n/components';
import { AuditionBanner } from '@/shared/components/audition-banner';
import { IdentityList } from '@/shared/components/identity-list';
import { MissingEvaluationBanner } from '@/shared/components/missing-evaluation';
import { PriorityBadgeList } from '@/shared/components/priority-badge';
import { TitleNameIcons } from '@/shared/components/title-name-icons';

import { SummarySectionCard } from './SummarySectionCard';

export function SummarySectionMagistrat() {
  const { summary, sessionId, nominationFileId } = useSummary();
  const isSg = useIsSg();

  return (
    <SummarySectionCard id="magistrat">
      <header className="fr-mb-6v">
        {summary.priorities.length > 0 && (
          <div className="fr-mb-3v">
            <PriorityBadgeList priorities={summary.priorities} small={false} />
          </div>
        )}
        <h1 className="fr-mb-0">
          <TitleNameIcons
            detailsLink={{
              context: isSg ? 'sg' : 'membre',
              magistratId: summary.detectedMagistratId,
            }}
            lolfi={{ sessionId, nominationFileId }}
            name={summary.name}
          />
        </h1>
      </header>

      <AuditionBanner
        date={summary.auditionDate}
        time={summary.auditionTime}
        className="fr-mb-6v rounded px-4 py-3"
      />

      <MissingEvaluationBanner
        className="fr-mb-6v rounded px-4 py-3"
        missingEvaluation={summary.missingEvaluation}
      />

      <IdentityList
        birthDate={summary.birthDate}
        currentPosition={summary.position}
        grade={summary.grade}
        positionDuration={
          summary.lastPositionDate && <FormattedPositionDuration value={summary.lastPositionDate} />
        }
        rank={summary.rank}
        targetedGrade={summary.targetedGrade}
        targetedPosition={summary.targetedPosition}
      />
    </SummarySectionCard>
  );
}
