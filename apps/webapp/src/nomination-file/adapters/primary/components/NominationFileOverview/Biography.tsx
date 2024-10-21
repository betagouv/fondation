import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { Card } from "./Card";

export type BiographyProps = {
  biography: string;
};

export const Biography: React.FC<BiographyProps> = ({ biography }) => (
  <Card>
    <div className={cx("fr-h2")}>Biographie</div>
    <textarea
      className="whitespace-pre-line leading-10 w-full"
      value={biography}
      rows={10}
    />
  </Card>
);
