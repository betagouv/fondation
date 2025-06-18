import { FC } from "react";
import { useAppSelector } from "../../../../../reports/adapters/primary/hooks/react-redux";
import { parseTransparenceCompositeId } from "../../../../core-logic/models/transparence.model";
import { selectTransparenceByCompositeId } from "../../selectors/selectTransparenceByCompositeId";

export interface TransparenceProps {
  id: string;
}

export const Transparence: FC<TransparenceProps> = ({ id }) => {
  const args = parseTransparenceCompositeId(id);
  const transparence = useAppSelector((state) =>
    args ? selectTransparenceByCompositeId(state, args) : undefined,
  );

  if (!transparence) {
    return <div>Session de type Transparence non trouvée.</div>;
  }
};
