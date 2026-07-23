import Badge from '@codegouvfr/react-dsfr/Badge';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link } from 'react-router';

import { NominationFileOutcomeBadge } from '@/features/nomination-files-table/components/cells/nomination-file-outcome/NominationFileOutcomeBadge';
import { UserAvatarList } from '@/shared/components/user-avatar';
import { NewTable } from '@/shared/ui/new-table/NewTable';
import { dateOnlyToDate } from '@/utils/date-only.util';
import { getDetailSessionGdsPath, ROUTE_PATHS } from '@/utils/route-path.utils';
import { isPastSchedule, toScheduledDate } from '@/utils/time-only.util';
import type { DetailedMagistratDto } from '@api/types';

type NominationFile = DetailedMagistratDto['propositions'][number];

const columnHelper = createColumnHelper<NominationFile>();

export function MagistratNominationFilesTable({
  context,
  enCoursIndicator = 'tint',
  nominationFiles,
}: {
  context: 'sg' | 'membre';
  enCoursIndicator?: 'badge' | 'dot' | 'tint';
  nominationFiles: NominationFile[];
}) {
  const { formatDate, formatMessage, formatTime } = useIntl();

  const columns = useMemo(
    () => [
      columnHelper.accessor('sessionName', {
        cell: (info) => {
          const sessionName = info.getValue();
          const isEnCours = info.row.original.isSessionReported;
          const sessionPath =
            context === 'membre'
              ? getDetailSessionGdsPath({ sessionId: info.row.original.sessionId })
              : generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: info.row.original.sessionId });

          return (
            <span className="flex flex-col items-start">
              {isEnCours && enCoursIndicator === 'badge' && (
                <Badge className="mb-3 min-h-0! px-1.5! text-[0.625rem]!" noIcon severity="info" small>
                  <FormattedMessage defaultMessage="En cours" />
                </Badge>
              )}
              <span>
                <Link className="fr-link fr-link--sm" to={sessionPath}>
                  {sessionName}
                </Link>
                {isEnCours && enCoursIndicator === 'dot' && (
                  <Tooltip kind="hover" title={formatMessage({ defaultMessage: 'Session en cours' })}>
                    <span className="relative ml-2.5 inline-flex size-2">
                      <span className="absolute size-full animate-ping rounded-full bg-(--info-425-625) opacity-75 motion-reduce:hidden" />
                      <span className="relative size-2 rounded-full bg-(--info-425-625)" />
                    </span>
                  </Tooltip>
                )}
              </span>
              <span className="mt-2 text-xs text-(--text-mention-grey)">
                {formatMessage(
                  { defaultMessage: 'Publié le {date}' },
                  {
                    date: formatDate(dateOnlyToDate(info.row.original.dateTransparence), {
                      format: 'dateOnlyShort',
                    }),
                  },
                )}
              </span>
            </span>
          );
        },
        header: formatMessage({ defaultMessage: 'Session' }),
        size: 200,
      }),
      columnHelper.accessor('number', {
        cell: (info) => <span className="w-full text-center">{info.getValue() ?? '-'}</span>,
        header: () => (
          <span className="w-full text-center">
            <FormattedMessage defaultMessage="N° doss." />
          </span>
        ),
        size: 90,
      }),
      columnHelper.accessor('targetedPosition', {
        cell: (info) => {
          const { targetedGrade, targetedPosition } = info.row.original;
          return [targetedGrade, targetedPosition].filter(Boolean).join(' - ') || '-';
        },
        header: formatMessage({ defaultMessage: 'Poste cible' }),
        size: 280,
      }),
      columnHelper.accessor('outcome', {
        cell: (info) => {
          const outcome = info.getValue();

          return (
            <span className="flex w-full justify-center">
              {outcome ? (
                <NominationFileOutcomeBadge
                  acronym
                  formation={info.row.original.formation}
                  label={outcome.label}
                  outcome={outcome.value}
                />
              ) : (
                '-'
              )}
            </span>
          );
        },
        header: () => (
          <span className="w-full text-center">
            <FormattedMessage defaultMessage="Issue" />
          </span>
        ),
        size: 100,
      }),
      columnHelper.accessor('auditionDate', {
        cell: (info) => {
          const { auditionDate, auditionTime } = info.row.original;
          const scheduledAt = toScheduledDate(auditionDate, auditionTime);
          if (!scheduledAt) {
            return info.row.original.isSessionReported ? formatMessage({ defaultMessage: 'À prévoir' }) : '-';
          }

          const values = {
            date: formatDate(scheduledAt, { format: 'dateOnlyShort' }),
            time: formatTime(scheduledAt, { format: 'timeOnlyShort' }),
          };

          return isPastSchedule(auditionDate, auditionTime)
            ? formatMessage({ defaultMessage: 'A eu lieu le {date} à {time}' }, values)
            : formatMessage({ defaultMessage: 'Prévue le {date} à {time}' }, values);
        },
        header: formatMessage({ defaultMessage: 'Audition' }),
        size: 150,
      }),
      columnHelper.accessor('reporters', {
        cell: (info) =>
          info.getValue().length === 0 ? '-' : <UserAvatarList size="sm" users={info.getValue()} />,
        header: formatMessage({ defaultMessage: 'Rapporteur(s)' }),
        size: 140,
      }),
    ],
    [context, enCoursIndicator, formatDate, formatMessage, formatTime],
  );

  const table = useReactTable({
    columns,
    data: nominationFiles,
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <NewTable
      className="max-h-80"
      fluid
      rowTint={(row) =>
        row.original.isSessionReported && enCoursIndicator === 'tint'
          ? 'bg-(--background-contrast-blue-cumulus) hover:bg-(--background-contrast-blue-cumulus-hover) [&>.fr-tooltip]:[--background-overlap-grey:var(--background-contrast-blue-cumulus)]'
          : undefined
      }
      rowTooltip={(row) =>
        row.original.isSessionReported && enCoursIndicator === 'tint'
          ? formatMessage({ defaultMessage: 'Session en cours' })
          : undefined
      }
      table={table}
      wrap
    />
  );
}
