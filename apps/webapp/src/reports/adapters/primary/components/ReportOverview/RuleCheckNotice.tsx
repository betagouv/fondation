import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import Notice from "@codegouvfr/react-dsfr/Notice";

export const RuleCheckNotice: React.FC = () => (
  <Notice
    isClosable
    title="Case cochée = la règle n'est pas respectée. Si le texte est rouge, cela signifie que notre outil de pré-analyse a détecté un risque de non-respect de la règle."
    className={cx("fr-px-4w", "fr-px-md-6w", "fr-py-3w", "fr-my-3w")}
  />
);
