import { useEffect } from "react";
import { summarySectionsObserverFactory } from "../../../dom/summary-section-observer-factory";

export const useObservedSections = (
  sectionIds: string[],
  onSectionIdIntersecting: (sectionId: string) => void,
) => {
  useEffect(() => {
    const { observeSections, unobserveSections } =
      summarySectionsObserverFactory(sectionIds, onSectionIdIntersecting);

    observeSections();
    return unobserveSections;
  }, [sectionIds, onSectionIdIntersecting]);
};
