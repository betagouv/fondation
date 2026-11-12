import { colors } from '@codegouvfr/react-dsfr';
import Badge from '@codegouvfr/react-dsfr/Badge';

const reportedBgColor = colors.decisions.artwork.background.purpleGlycine.default;
const reportedTextColor = colors.decisions.text.actionHigh.purpleGlycine.default;

// the sessions list knows TO_VALIDATE and READY, the tables across sessions ONGOING and ARCHIVED
export function SessionStatusBadge(props: {
  status: 'ARCHIVED' | 'ONGOING' | 'READY' | 'REPORTED' | 'TO_VALIDATE';
}) {
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
    case 'ARCHIVED':
      return (
        <Badge noIcon as="span" small>
          ARCHIVÉE
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
