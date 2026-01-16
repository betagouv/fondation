import { ScrollToTop } from '../shared/ScrollToTop';
import { SummaryAutoSaveAlert } from './components/SummaryAutoSaveNotice';
import { SummaryOutcomeNotice } from './components/SummaryOutcomeNotice';
import { SummarySectionAttachments } from './components/SummarySectionAttachments';
import { SummarySectionBiography } from './components/SummarySectionBiography';
import { SummarySectionMagistrat } from './components/SummarySectionMagistrat';
import { SummarySectionObservations } from './components/SummarySectionObservations';
import { SummarySideNav } from './components/SummarySideNav';

export function Summary() {
  return (
    <div className="flex flex-col">
      <SummaryOutcomeNotice />
      <SummaryAutoSaveAlert />

      <div className="flex flex-col items-center gap-y-4 md:flex-row md:items-start md:justify-center md:gap-x-4">
        <div className="w-7/12 flex-shrink-0 flex-grow-0 flex-nowrap md:w-4/12 lg:w-3/12">
          <SummarySideNav />
        </div>
        <div className="w-10/12 flex-shrink-0 flex-grow-0 flex-nowrap md:w-8/12">
          <div className="flex flex-col gap-y-8">
            <SummarySectionMagistrat />
            <SummarySectionBiography />
            <SummarySectionObservations />
            <SummarySectionAttachments />
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
}
