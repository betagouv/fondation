import { ReportVM } from "../../../../core-logic/view-models/ReportVM";
import { reportHtmlIds } from "../../dom/html-ids";
import { Card } from "./Card";

export type BiographyProps = {
  biography: string | null;
};

export const Biography: React.FC<BiographyProps> = ({ biography }) => (
  <Card id={reportHtmlIds.overview.biographySection}>
    <h2 id={reportHtmlIds.overview.biography}>{ReportVM.biographyLabel}</h2>
    <div
      aria-labelledby={reportHtmlIds.overview.biography}
      className="w-full whitespace-pre-line leading-10"
    >
      {biography}
    </div>
  </Card>
);
