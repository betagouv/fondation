import { Transparency } from "shared-models";

export interface RouterProvider {
  goToLogin(): void;
  goToTransparencies(): void;
  getLoginHref(): string;
  getTransparenciesAnchorAttributes: () => {
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  };
  getTransparencyReportsAnchorAttributes: (transparency: Transparency) => {
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  };
  getReportOverviewAnchorAttributes: (
    transparency: Transparency,
    id: string,
  ) => {
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  };
  getLoginAnchorAttributes: () => {
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  };
}
