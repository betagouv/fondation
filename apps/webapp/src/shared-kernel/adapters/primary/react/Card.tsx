import { Card as DsfrCard } from "@codegouvfr/react-dsfr/Card";
import { RegisteredLinkProps } from "@codegouvfr/react-dsfr/link";

export type CardProps = {
  title: string;
  description: string;
  linkProps: RegisteredLinkProps;
} & React.HTMLAttributes<HTMLDivElement>;

export const Card = ({
  title,
  description,
  className,
  linkProps,
}: CardProps) => {
  return (
    <div className="container">
      <DsfrCard
        className={`${className}`}
        title={title}
        desc={description}
        enlargeLink
        linkProps={linkProps}
      />
    </div>
  );
};
