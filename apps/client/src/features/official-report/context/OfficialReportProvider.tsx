import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { useConfirmation } from '@/shared/context/confirmation';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  officialReportKeys,
  useCreateOfficialReportMutation,
  useDetailsOfficialReportQuery,
  useResetOfficialReportDocumentMutation,
  useUpdateOfficialReportMutation,
} from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import { OfficialReportContext } from './OfficialReportContext';
import type { OfficialReport } from './OfficialReportContext.types';

export function OfficialReportProvider(props: React.PropsWithChildren) {
  const { sessionId = '', officialReportId = null } = useParams<{
    sessionId: string;
    officialReportId?: string;
  }>();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { waitForConfirmation } = useConfirmation();
  const queryClient = useQueryClient();

  const createOfficialReport = useCreateOfficialReportMutation();
  const updateOfficialReport = useUpdateOfficialReportMutation(sessionId);
  const resetOfficialReport = useResetOfficialReportDocumentMutation(officialReportId ?? '');

  const { data: session, isFetching: sessionFetching } = useDetailedNominationSessionQuery({
    sessionId,
  });
  const {
    data: officialReportMetadata,
    isFetching: officialReportMetadataFetching,
    isFetched: metadataFetched,
  } = useDetailsOfficialReportQuery({ officialReportId });

  const [state, setState] = React.useState(null as OfficialReport | null);

  React.useEffect(() => {
    if (!officialReportMetadata) return;

    setState((s) => ({
      ...s,
      agendaId: officialReportMetadata.agendas[0],
      sessionMeetingDate: officialReportMetadata.sessionMeetingDate,
      sessionMeetingStartingTime: officialReportMetadata.sessionMeetingStartingTime ?? {},
      sessionMeetingEndingTime: officialReportMetadata.sessionMeetingEndingTime ?? {},
      hasRenunciation: officialReportMetadata.hasRenunciation,
      justiceContactId: officialReportMetadata.justiceDepartmentContactId ?? '',
      chairmanId: officialReportMetadata.chairmanId ?? '',
      secretaryId: officialReportMetadata.secretaryId ?? '',
      memberIds: officialReportMetadata.absentMembers,
    }));
  }, [officialReportMetadata]);

  const isFetching = React.useMemo(
    () =>
      sessionFetching ||
      officialReportMetadataFetching ||
      (metadataFetched && state?.chairmanId !== officialReportMetadata?.chairmanId),
    [sessionFetching, officialReportMetadataFetching, state, metadataFetched, officialReportMetadata],
  );

  const cancel = React.useCallback(
    () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId })),
    [navigate, sessionId],
  );

  const submit = React.useCallback(
    async (metadata: OfficialReport) => {
      if (officialReportId) {
        const { isConfirmed } = await waitForConfirmation({
          title: formatMessage({ defaultMessage: `Supprimer l'ancienne version` }),
          i18n: { confirm: formatMessage({ defaultMessage: `Oui, écraser le procès-verbal` }) },
          content: (
            <>
              <p>
                {officialReportMetadata?.isManuallyEdited ? (
                  <FormattedMessage
                    values={{ bold: (x) => <strong>{x}</strong> }}
                    defaultMessage={
                      `En confirmant, vous allez écraser l'ancienne version du procès-verbal,` +
                      `<bold>y compris ses éditions manuelles</bold> sans pouvoir les récupérer`
                    }
                  />
                ) : (
                  <FormattedMessage
                    defaultMessage={
                      `En confirmant, vous allez écraser l'ancienne version du procès-verbal ` +
                      `sans pouvoir la récupérer`
                    }
                  />
                )}
              </p>
              <p>
                <FormattedMessage defaultMessage={`Voulez-vous continuer\u00A0?`} />
              </p>
            </>
          ),
        });

        if (!isConfirmed) return;
      }

      const payload = {
        sessionMeetingDate: metadata.sessionMeetingDate,
        sessionMeetingTime: { hours: 0, minutes: 0, ...metadata.sessionMeetingStartingTime },
        sessionMeetingEndingTime: { hours: 0, minutes: 0, ...metadata.sessionMeetingEndingTime },
        hasRenunciation: metadata.hasRenunciation,
        justiceDepartmentContactId: metadata.justiceContactId,
        chairmanId: metadata.chairmanId,
        secretaryId: metadata.secretaryId,
        agendas: [metadata.agendaId],
        members: metadata.memberIds,
      };

      async function onSuccess(result: { id: string } | undefined) {
        const id = result?.id || officialReportId;
        if (id) {
          await queryClient.invalidateQueries({ queryKey: officialReportKeys.officialReportHtml(id) });
          return navigate(
            generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW, {
              sessionId,
              officialReportId: id,
            }),
          );
        }
      }

      if (officialReportId) {
        resetOfficialReport.mutate(undefined, {
          onSuccess: () => updateOfficialReport.mutate({ ...payload, officialReportId }, { onSuccess }),
        });
      } else {
        createOfficialReport.mutate({ ...payload, sessionId }, { onSuccess });
      }
    },
    [
      officialReportId,
      createOfficialReport,
      updateOfficialReport,
      resetOfficialReport,
      sessionId,
      navigate,
      queryClient,
      waitForConfirmation,
      formatMessage,
      officialReportMetadata?.isManuallyEdited,
    ],
  );

  return (
    <OfficialReportContext
      value={{
        cancel,
        submit,
        officialReportId,
        report: state,
        session: { id: sessionId, formation: session?.formation ?? 'SIEGE' },
        isSubmitting: createOfficialReport.isPending || updateOfficialReport.isPending,
      }}
    >
      {isFetching ? <span className="ri-loader-4-line animate-spin" /> : props.children}
    </OfficialReportContext>
  );
}
