import { reportHtmlIds } from '../components/reports/dom/html-ids';
import {
  summaryLabels,
  type SummarySection
} from '../components/reports/labels/summary-labels';

export const SUMMARY_SECTIONS: SummarySection[] = [
  {
    anchorId: reportHtmlIds.overview.biographySection,
    label: summaryLabels.biography
  },
  {
    anchorId: reportHtmlIds.overview.commentSection,
    label: summaryLabels.comment
  },
  {
    anchorId: reportHtmlIds.overview.observersSection,
    label: summaryLabels.observers
  },
  {
    anchorId: reportHtmlIds.overview.statutorySection,
    label: summaryLabels.rules.statutory
  },
  {
    anchorId: reportHtmlIds.overview.managementSection,
    label: summaryLabels.rules.management
  },
  {
    anchorId: reportHtmlIds.overview.qualitativeSection,
    label: summaryLabels.rules.qualitative
  },
  {
    anchorId: reportHtmlIds.overview.attachedFilesSection,
    label: summaryLabels.attachedFiles
  }
];
