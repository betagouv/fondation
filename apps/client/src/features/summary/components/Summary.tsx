import { useSummary } from '@/features/summary/context/SummaryContext';
import { ScrollToTop } from '@/shared/ui/ScrollToTop';

import { SummaryAutoSaveAlert } from './SummaryAutoSaveNotice';
import { SummaryBreadcrumb } from './SummaryBreadcrumb';
import { SummaryOutcomeNotice } from './SummaryOutcomeNotice';
import { SummaryReaderSelector } from './SummaryReaderSelector';
import { SummarySectionAttachments } from './SummarySectionAttachments';
import { SummarySectionAuditionDate } from './SummarySectionAuditionDate';
import { SummarySectionBiography } from './SummarySectionBiography';
import { SummarySectionContent } from './SummarySectionContent';
import { SummarySectionMagistrat } from './SummarySectionMagistrat';
import { SummarySectionObservations } from './SummarySectionObservations';
import { SummarySideNav } from './SummarySideNav';

export function Summary() {
  const { canWriteSummary } = useSummary();
  return (
    <div className="flex flex-col">
      <SummaryBreadcrumb />
      <SummaryOutcomeNotice />
      <SummaryAutoSaveAlert />

      {canWriteSummary ? (
        <div className="fr-pb-8v mx-auto flex flex-row justify-end lg:w-11/12">
          <SummaryReaderSelector />
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-y-4 md:flex-row md:items-start md:justify-center md:gap-x-4">
        <div className="w-7/12 shrink-0 grow-0 flex-nowrap md:sticky md:top-0 md:w-4/12 lg:w-3/12">
          <SummarySideNav />
        </div>
        <div className="w-10/12 shrink-0 grow-0 flex-nowrap md:w-8/12">
          <div className="flex flex-col gap-y-8">
            <SummarySectionMagistrat />
            <SummarySectionBiography />
            <SummarySectionObservations />
            <SummarySectionContent />
            <SummarySectionAttachments />
            <SummarySectionAuditionDate />
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
}
