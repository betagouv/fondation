export type BreadcrumbVM = {
  currentPageLabel: string;
  segments: {
    label: string;
    to: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  }[];
};
