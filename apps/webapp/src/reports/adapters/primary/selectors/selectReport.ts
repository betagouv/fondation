import { DateOnlyJson } from "shared-models";
import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
import { ReportSM } from "../../../../store/appState";
import { createAppSelector } from "../../../../store/createAppSelector";
import { ReportVMRulesBuilder } from "../../../core-logic/builders/ReportVMRules.builder";
import { ReportVM } from "../../../core-logic/view-models/ReportVM";

export const selectReport = createAppSelector(
  [
    (state) => state.reportOverview.byIds,
    (_, id: string) => id,
    (state) => state.reportOverview.rulesMap,
    (state) => state.reportOverview.rulesLabelsMap,
    (state) => state.sharedKernel.currentDate,
  ],
  (byIds, id, rulesMap, rulesLabelsMap, currentDate): ReportVM | null => {
    const report = byIds?.[id];
    if (!report) return null;

    return {
      id: report.id,
      name: report.name,
      biography: report.biography ? formatBiography(report.biography) : null,
      dueDate: report.dueDate
        ? DateOnly.fromStoreModel(report.dueDate).toFormattedString()
        : null,
      birthDate: formatBirthDate(report.birthDate, currentDate),
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
        rulesLabelsMap,
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

const formatBirthDate = (birthDateJson: DateOnlyJson, currentDate: Date) => {
  const birthDate = DateOnly.fromStoreModel(birthDateJson);
  const today = DateOnly.fromDate(currentDate);
  const age = birthDate.getAge(today);
  return `${birthDate.toFormattedString()} (${age} ans)`;
};
