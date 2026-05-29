import { colors } from '@codegouvfr/react-dsfr';
import Badge from '@codegouvfr/react-dsfr/Badge';

const reportedBgColor = colors.decisions.artwork.background.purpleGlycine.default;
const reportedTextColor = colors.decisions.text.actionHigh.purpleGlycine.default;

export function SessionStatusBadge(props: { status: 'READY' | 'TO_VALIDATE' | 'REPORTED' }) {
  switch (props.status) {
    case 'TO_VALIDATE':
      return (
        <Badge small severity="new">
          NOUVEAU
        </Badge>
      );
    case 'REPORTED':
      return (
        <Badge noIcon as="span" small style={{ color: reportedTextColor, background: reportedBgColor }}>
          RESTITUÉE
        </Badge>
      );
    default:
      return (
        <Badge small severity="info" noIcon>
          EN COURS
        </Badge>
      );
  }
}
