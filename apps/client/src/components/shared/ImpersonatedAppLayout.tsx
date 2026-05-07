import { colors } from '@codegouvfr/react-dsfr';

const textColor = colors.options.purpleGlycine._975_75.default;
const bgColor = colors.options.purpleGlycine._850_200.default;

export const StagingAppLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const isStaging = !import.meta.env.DEV && import.meta.env.VITE_DEPLOY_ENV === 'staging';

  if (!isStaging) return children;

  return (
    <>
      <div
        className="fixed top-0 right-0 left-0 z-1000 flex h-10 items-center justify-center"
        style={{ color: textColor, backgroundColor: bgColor }}
      >
        <p className="mb-0 text-sm">
          <span className="font-bold">Environnement hors-production.</span>
          <span className="ml-1">Les données affichées sont fictives</span>
        </p>
      </div>
      <div className="mt-10">{children}</div>
    </>
  );
};
