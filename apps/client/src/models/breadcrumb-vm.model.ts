export type BreadcrumbVM = {
  currentPageLabel: string;
  segments: {
    label: string;
    to: string;
  }[];
};
