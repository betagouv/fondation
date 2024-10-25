import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { Card } from "./Card";

export type BiographyProps = {
  biography: string | null;
};

export const Biography: React.FC<BiographyProps> = ({ biography }) => (
  <Card>
    <label className={cx("fr-h2")} id="biography">
      Biographie
    </label>
    <div
      aria-labelledby="biography"
      className="whitespace-pre-line leading-10 w-full"
    >
      {biography}
    </div>
  </Card>
);
