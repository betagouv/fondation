import { colors } from '@codegouvfr/react-dsfr';

export const ErrorMessage = ({ message }: { message: string }) => {
  return <div style={{ color: colors.options.error._425_625.default }}>{message}</div>;
};
