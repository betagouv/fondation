import { Transparency } from "shared-models";

export interface RouterProvider {
  goToLogin(): void;
  goToTransparencies(): void;
  getLoginHref(): string;
  getTransparenciesHref(): string;
  getReportListHref(transparency: Transparency): string;
  getReportOverviewAnchorAttributes: (
    transparency: Transparency,
    id: string,
  ) => {
    href: string;
    onClick: () => void;
  };
}
