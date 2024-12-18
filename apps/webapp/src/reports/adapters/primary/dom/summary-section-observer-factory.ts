import { isScrollingToSummarySection } from "./summary-scroll-listeners";

type Notify = (targetId: string) => void;

const notifyMostVisibleSectionFactory =
  (notify: Notify) => (entries: IntersectionObserverEntry[]) =>
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!isScrollingToSummarySection) {
          notify(entry.target.id);
        }
      }
    });

export const summarySectionsObserverFactory = (
  sectionIds: string[],
  notify: Notify,
) => {
  const sectionNodes = sectionIds
    .map((id) => document.getElementById(id))
    .filter<HTMLElement>((node) => !!node);

  const observer = new IntersectionObserver(
    notifyMostVisibleSectionFactory(notify),
    { threshold: 1 },
  );

  const observeSections = () =>
    sectionNodes.forEach((sectionNode) => observer.observe(sectionNode));
  const unobserveSections = () =>
    sectionNodes.forEach((sectionNode) => observer.unobserve(sectionNode));

  return { observeSections, unobserveSections };
};
