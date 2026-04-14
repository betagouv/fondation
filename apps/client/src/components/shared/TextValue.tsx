import { cx } from '@codegouvfr/react-dsfr/fr/cx';

export const TextValue = ({ label, value }: { label: string; value: React.ReactNode }) => {
  return (
    <div>
      <span className={cx('fr-text--bold')}>{`${label} : `}</span>
      <span>{value}</span>
    </div>
  );
};
