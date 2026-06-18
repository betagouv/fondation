import { colors } from '@codegouvfr/react-dsfr';

export const ErrorMessage = ({ message }: { message: string }) => {
  return <div style={{ color: colors.decisions.text.default.error.default }}>{message}</div>;
};
