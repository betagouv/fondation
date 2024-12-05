import { createSelector } from "@reduxjs/toolkit";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { ReportVMRulesBuilder } from "../../../core-logic/builders/ReportVMRules.builder";
import { ReportVM } from "../../../core-logic/view-models/ReportVM";
import { AppState, ReportSM } from "../../../store/appState";

export const selectReport = createSelector(
  [
    (state: AppState) => state.reportOverview.byIds,
    (_, id: string) => id,
    (state: AppState) => state.reportOverview.rulesMap,
  ],
  (byIds, id, rulesTuple): ReportVM | null => {
    const report = byIds?.[id];
    if (!report) return null;

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
        rulesTuple,
      ),
      attachedFiles: report.attachedFiles,
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
