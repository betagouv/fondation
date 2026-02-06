import type { To } from 'react-router';

export type BreadcrumbVM = {
  currentPageLabel: string;
  segments: {
    label: string;
    to: To;
  }[];
};
