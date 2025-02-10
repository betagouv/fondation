import { useAppSelector } from "../../hooks/react-redux";
import { selectTransparencies } from "../../selectors/selectTransparencies";
import { CsmTransparencies } from "./CsmTransparencies";
import { GdsTransparencies } from "./GdsTransparencies";

export const Transparencies = () => {
  const transparencies = useAppSelector(selectTransparencies);
  const gdsTransparencies = transparencies["GARDE DES SCEAUX"];

  return (
    <div>
      <div>
        <h1>Bonjour,</h1>
        <p
          style={{
            display: transparencies.noTransparencies ? "block" : "none",
          }}
        >
          Il n'y a pas de transparences actives.
        </p>
        <p
          style={{
            display: transparencies.noTransparencies ? "none" : "block",
          }}
        >
          Sur quel type de saisine souhaitez-vous travailler ?
        </p>
      </div>
      <div>
        <GdsTransparencies gdsTransparencies={gdsTransparencies} />
        <CsmTransparencies />
      </div>
    </div>
  );
};
