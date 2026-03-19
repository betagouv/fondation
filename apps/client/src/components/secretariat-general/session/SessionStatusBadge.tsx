import Badge from '@codegouvfr/react-dsfr/Badge';

export function SessionStatusBadge(props: { status: 'READY' | 'TO_VALIDATE' }) {
  switch (props.status) {
    case 'TO_VALIDATE':
      return (
        <Badge small severity="new">
          NOUVEAU
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
