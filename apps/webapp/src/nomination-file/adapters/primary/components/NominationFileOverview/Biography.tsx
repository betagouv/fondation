import { TextareaCard } from "./TextareaCard";

export type BiographyProps = {
  biography: string | null;
  onUpdate: (biography: string) => void;
};

export const Biography: React.FC<BiographyProps> = ({
  biography,
  onUpdate,
}) => (
  <TextareaCard
    id="biography"
    label="Biographie"
    content={biography}
    onContentChange={onUpdate}
  />
);
