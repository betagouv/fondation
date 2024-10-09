import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { Card } from "./Card";

export type BiographyProps = {
  biography: string;
};

export const Biography: React.FC<BiographyProps> = ({ biography }) => (
  <Card>
    <div className={cx("fr-h2")}>Biographie</div>
    <p className="whitespace-pre-line leading-10">{biography}</p>
  </Card>
);
