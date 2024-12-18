import { useEffect, useMemo } from "react";
import { summarySectionsObserverFactory } from "../../../dom/summary-section-observer-factory";

export const useObservedSections = (
  sectionIds: string[],
  onSectionIdIntersecting: (sectionId: string) => void,
) => {
  const { observeSections, unobserveSections } = useMemo(
    () => summarySectionsObserverFactory(sectionIds, onSectionIdIntersecting),
    [sectionIds, onSectionIdIntersecting],
  );

  useEffect(() => {
    observeSections();
    return () => unobserveSections();
  }, [observeSections, unobserveSections]);
};
