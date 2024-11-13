import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import Notice from "@codegouvfr/react-dsfr/Notice";

export const AutoSaveNotice: React.FC = () => (
  <Notice
    isClosable
    title="L'enregistrement des modifications est automatique."
    className={cx(
      "fr-col-11",
      "fr-col-md-10",
      "fr-px-4w",
      "fr-py-3w",
      "fr-my-7w",
    )}
  />
);
