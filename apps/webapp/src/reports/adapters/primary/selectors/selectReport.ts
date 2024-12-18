import { createSelector } from "@reduxjs/toolkit";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { AppState, ReportSM } from "../../../../store/appState";
import { ReportVMRulesBuilder } from "../../../core-logic/builders/ReportVMRules.builder";
import { ReportVM } from "../../../core-logic/view-models/ReportVM";
import { reportHtmlIds } from "../dom/html-ids";
import { SummarySection } from "../labels/summary-labels";

export const selectReport = createSelector(
  [
    (state: AppState) => state.reportOverview.byIds,
    (_, id: string) => id,
    (state: AppState) => state.reportOverview.rulesMap,
    (state: AppState) => state.reportOverview.summarySections,
  ],
  (byIds, id, rulesMap, summarySections): ReportVM | null => {
    const report = byIds?.[id];
    if (!report) return null;

    const filterOutObserversInSummary = ({
      anchorId,
    }: SummarySection): boolean => {
      const isObserverSection = anchorId === htmlIds.observersSection;
      const isOtherSection = !isObserverSection;
      const hasNoObserver = !!report.observers?.length;

      return isOtherSection || (isObserverSection && hasNoObserver);
    };

    return {
      id: report.id,
      name: report.name,
      biography: report.biography ? formatBiography(report.biography) : null,
      dueDate: report.dueDate
        ? DateOnly.fromStoreModel(report.dueDate).toFormattedString()
        : null,
      birthDate: DateOnly.fromStoreModel(report.birthDate).toFormattedString(),
      state: report.state,
      formation: report.formation,
      transparency: report.transparency,
      grade: report.grade,
      currentPosition: report.currentPosition,
      targettedPosition: report.targettedPosition,
      comment: report.comment,
      rank: report.rank,
      observers: formatObservers(report.observers),
      rulesChecked: ReportVMRulesBuilder.buildFromStoreModel(
        report.rules,
        rulesMap,
      ),
      attachedFiles: report.attachedFiles,
      summary: summarySections.filter(filterOutObserversInSummary),
    };
  },
);

const formatBiography = (biography: string) => {
  if (biography.indexOf("- ") === -1) return biography;

  const biographyElements = biography
    .trim()
    .split("- ")
    .map((part) => part.trim());
  // we skipt the real first element because it is empty
  const [, firstElement, ...otherElements] = biographyElements;
  return `- ${firstElement}\n- ${otherElements.join("\n- ")}`;
};

const formatObservers = (
  observers: ReportSM["observers"],
): ReportVM["observers"] =>
  observers?.map((observer) => observer.split("\n") as [string, ...string[]]) ||
  null;

const htmlIds = reportHtmlIds.overview;
