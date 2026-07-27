import Badge from '@codegouvfr/react-dsfr/Badge';
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
import type { ListedMagistratNominationFilesDto } from '@api/types';

export type MagistratNominationFile = ListedMagistratNominationFilesDto['items'][number];

const columnHelper = createColumnHelper<MagistratNominationFile>();

export function MagistratNominationFilesTable({
  context,
  nominationFiles,
}: {
  context: 'sg' | 'membre';
  nominationFiles: MagistratNominationFile[];
}) {
  const { formatDate, formatMessage, formatTime } = useIntl();

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.session.name, {
        id: 'session',
        cell: (info) => {
          const { session } = info.row.original;
          const isOngoing = session.status === 'ONGOING';
          const sessionPath =
            context === 'membre'
              ? getDetailSessionGdsPath({ sessionId: session.id })
              : generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: session.id });
          const words = session.name.split(' ');
          const lastWord = words.pop();
          const leadingWords = words.join(' ');

          return (
            <span className="flex min-w-0 flex-col items-start">
              <span className="w-full">
                <Link className="fr-link fr-link--sm fr-reset-link underline-offset-4!" to={sessionPath}>
                  {leadingWords && `${leadingWords} `}
                  <span className="whitespace-nowrap">
                    {lastWord}
                    {isOngoing && (
                      <Badge
                        className="ml-1.5 min-h-0! px-1.5! align-middle text-[0.5625rem]! leading-4! whitespace-nowrap"
                        noIcon
                        severity="info"
                        small
                      >
                        <FormattedMessage defaultMessage="En cours" />
                      </Badge>
                    )}
                  </span>
                </Link>
              </span>
              <span className="mt-2 text-xs text-(--text-mention-grey)">
                {formatMessage(
                  { defaultMessage: 'Publié le {date}' },
                  {
                    date: formatDate(dateOnlyToDate(session.date), {
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
                  formation={info.row.original.session.formation}
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
            return info.row.original.session.status === 'ONGOING'
              ? formatMessage({ defaultMessage: 'À prévoir' })
              : '-';
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
    [context, formatDate, formatMessage, formatTime],
  );

  const table = useReactTable({
    columns,
    data: nominationFiles,
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
  });

  return <NewTable className="max-h-80" fluid table={table} wrap />;
}
