import { FormattedMessage } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useSummary } from '@/features/summary/context/SummaryContext';
import { FormattedPositionDuration } from '@/i18n/components';
import { AuditionScheduledBanner } from '@/shared/components/audition-banner';
import { DetailsLink } from '@/shared/components/details-link';
import { IdentityList } from '@/shared/components/identity-list';
import { LolfiLink } from '@/shared/components/lolfi-link';
import { PriorityBadgeList } from '@/shared/components/priority-badge';
import { TitleNameIcons } from '@/shared/components/title-name-icons';
import { AlertBanner } from '@/shared/ui/alert-banner';

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
          <TitleNameIcons name={summary.name}>
            <DetailsLink context={isSg ? 'sg' : 'membre'} magistratId={summary.detectedMagistratId} />
            <LolfiLink name={summary.name} nominationFileId={nominationFileId} sessionId={sessionId} />
          </TitleNameIcons>
        </h1>
      </header>

      <AuditionScheduledBanner
        className="fr-mb-6v rounded px-4 py-3"
        date={summary.auditionDate}
        time={summary.auditionTime}
      />

      {summary.missingEvaluation && (
        <AlertBanner
          className="fr-mb-6v rounded px-4 py-3"
          icon="fr-icon-draft-line"
          message={
            <FormattedMessage defaultMessage="Évaluation manquante dans le dossier administratif LOLFI" />
          }
          tone="warning"
        />
      )}

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
