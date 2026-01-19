import type { To } from 'react-router-dom';

export type BreadcrumbVM = {
  currentPageLabel: string;
  segments: {
    label: string;
    to: To;
  }[];
};
