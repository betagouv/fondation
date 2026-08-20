/* oxlint-disable */
// this file is auto-generated

import { client } from './client.ts';
import { type Client, type ClientMeta, formDataBodySerializer, type Options as Options2, type RequestResult, type TDataShape } from './client/index.ts';
import type { AffectReportersData, AffectReportersResponses, ArchiveSessionData, ArchiveSessionResponses, AttachFilesData, AttachFilesResponses, AttachMemberCommentScreenshotsData, AttachMemberCommentScreenshotsResponses, AttachScreenshotsData, AttachScreenshotsResponses, AttachSummaryFilesData, AttachSummaryFilesResponses, AutoAffectationData, AutoAffectationResponses, CallbackData, CallbackResponses, CountNominationFilesByStatusData, CountNominationFilesByStatusResponses, CountUnaffectedNominationFilesData, CountUnaffectedNominationFilesResponses, CountUsersNewSessionsData, CountUsersNewSessionsResponses, CreateAgendaData, CreateAgendaResponses, CreateJusticeContactData, CreateJusticeContactResponses, CreateJusticePresentationPlanData, CreateJusticePresentationPlanResponses, CreateNominationFileAttachmentUrlData, CreateNominationFileAttachmentUrlResponses, CreateNominationSessionAttachmentUrlData, CreateNominationSessionAttachmentUrlResponses, CreateObservationData, CreateObservationResponses, CreateOfficialReportData, CreateOfficialReportResponses, CreateSessionFromLodamData, CreateSessionFromLodamResponses, CreateSummaryData, CreateSummaryResponses, DefineNominationFileOutcomeData, DefineNominationFileOutcomeResponses, DeleteAgendaData, DeleteAgendaResponses, DeleteJusticePresentationPlanData, DeleteJusticePresentationPlanResponses, DeleteNominationSessionData, DeleteNominationSessionResponses, DeleteObservationData, DeleteObservationResponses, DeleteOfficialReportData, DeleteOfficialReportResponses, DemoteFromAdminData, DemoteFromAdminResponses, DetachFilesData, DetachFilesResponses, DetachSummaryFilesData, DetachSummaryFilesResponses, DetailMagistratData, DetailMagistratResponses, DetailNominationFileData, DetailNominationFileResponses, DetailNominationSessionAffectationsVersionData, DetailNominationSessionAffectationsVersionResponses, DetailReportData, DetailReportResponses, DetailsAgendaDocumentBlocksData, DetailsAgendaDocumentBlocksResponses, DetailsAgendaFilesData, DetailsAgendaFilesResponses, DetailsAgendaMetadataData, DetailsAgendaMetadataResponses, DetailsJobData, DetailsJobResponses, DetailsJusticePresentationPlanPdfDocumentData, DetailsJusticePresentationPlanPdfDocumentResponses, DetailsMemberData, DetailsMemberResponses, DetailsNominationSessionData, DetailsNominationSessionResponses, DetailsOfficialReportData, DetailsOfficialReportDocumentData, DetailsOfficialReportDocumentResponses, DetailsOfficialReportResponses, DetailsPresentationPlanMetadataData, DetailsPresentationPlanMetadataResponses, DetailsSessionAgendaData, DetailsSessionAgendaResponses, DetailsSessionOfficialReportData, DetailsSessionOfficialReportResponses, DetailSummaryData, DetailSummaryResponses, DetailsUserData, DetailsUserResponses, EditAgendaFileBlockData, EditAgendaFileBlockResponses, EditOfficialReportConclusionData, EditOfficialReportConclusionResponses, EditOfficialReportFileData, EditOfficialReportFileResponses, EditOfficialReportIntroData, EditOfficialReportIntroResponses, EditOfficialReportSectionIntroData, EditOfficialReportSectionIntroResponses, EditOfficialReportSectionTitleData, EditOfficialReportSectionTitleResponses, ExcludeJurisdictionsData, ExcludeJurisdictionsResponses, FindAgendaNominationFilesData, FindAgendaNominationFilesResponses, FindDocsMembersData, FindDocsMembersResponses, FindSessionDocsData, FindSessionDocsResponses, FollowUpOnObservationData, FollowUpOnObservationResponses, GenerateAgendaHtmlData, GenerateAgendaHtmlResponses, GenerateAgendaPdfData, GenerateAgendaPdfResponses, GenerateAttachmentPublicUrlData, GenerateAttachmentPublicUrlResponses, GenerateOfficialReportHtmlData, GenerateOfficialReportHtmlResponses, GenerateOfficialReportPdfData, GenerateOfficialReportPdfResponses, GeneratePresentationPlanHtmlData, GeneratePresentationPlanHtmlResponses, GeneratePresentationPlanPdfData, GeneratePresentationPlanPdfResponses, GetFileByFileUrlData, GetFileByFileUrlResponses, GetLolfiMagistratUrlData, GetLolfiMagistratUrlResponses, GetObservationDetailsData, GetObservationDetailsResponses, GetObservationFileUrlData, GetObservationFileUrlResponses, GetReportFilesUrlData, GetReportFilesUrlResponses, HideNominationFileAlertData, HideNominationFileAlertResponses, ImpersonateData, ImpersonateResponses, IncludeFilesInContentData, IncludeFilesInContentResponses, IngestLolfiArchiveData, IngestLolfiArchiveResponses, IntrospectSessionData, IntrospectSessionResponses, IsSessionReadyForDocGenerationData, IsSessionReadyForDocGenerationResponses, ListAgendasForNewOfficialReportData, ListAgendasForNewOfficialReportResponses, ListArchivedSessionsData, ListArchivedSessionsResponses, ListCurrentlyAffectedReportersData, ListCurrentlyAffectedReportersResponses, ListJobsData, ListJobsResponses, ListMagistratNominationFilesData, ListMagistratNominationFilesResponses, ListMagistratObservationsData, ListMagistratObservationsResponses, ListMembersData, ListMemberSessionReportsData, ListMemberSessionReportsResponses, ListMemberSessionsData, ListMemberSessionsResponses, ListMembersResponses, ListMissingEvaluationsAsExcelData, ListMissingEvaluationsAsExcelResponses, ListNominationFileAttachmentsData, ListNominationFileAttachmentsResponses, ListNominationFilesAsExcelData, ListNominationFilesAsExcelResponses, ListNominationFilesData, ListNominationFilesResponses, ListNominationSessionAttachmentsData, ListNominationSessionAttachmentsResponses, ListNonPresentedPlansData, ListNonPresentedPlansResponses, ListObservationsAttachmentsData, ListObservationsAttachmentsResponses, ListObservationsData, ListObservationsResponses, ListOpenIdProvidersData, ListOpenIdProvidersResponses, ListPresentationPlanAgendasData, ListPresentationPlanAgendasResponses, ListPresentedPlansData, ListPresentedPlansResponses, ListSecretariesGeneralData, ListSecretariesGeneralResponses, ListSessionsOfTypeGardeDesSceauxData, ListSessionsOfTypeGardeDesSceauxResponses, ListUsersData, ListUsersResponses, LoginData, LoginResponses, LogoutData, LogoutResponses, PrepareOpenIdRequestData, PrepareOpenIdRequestResponses, PresentPlanData, PresentPlanResponses, PromoteToAdminData, PromoteToAdminResponses, PublishNominationSessionAffectationsVersionData, PublishNominationSessionAffectationsVersionResponses, RemoveNominationFileAttachmentData, RemoveNominationFileAttachmentResponses, RemoveSessionAttachmentData, RemoveSessionAttachmentResponses, ResetAgendaDocumentData, ResetAgendaDocumentResponses, ResetAgendaFileBlockData, ResetAgendaFileBlockResponses, ResetOfficialReportConclusionData, ResetOfficialReportConclusionResponses, ResetOfficialReportDocumentData, ResetOfficialReportDocumentResponses, ResetOfficialReportFileData, ResetOfficialReportFileResponses, ResetOfficialReportIntroData, ResetOfficialReportIntroResponses, ResetOfficialReportSectionIntroData, ResetOfficialReportSectionIntroResponses, ResetOfficialReportSectionTitleData, ResetOfficialReportSectionTitleResponses, ResetPresentationPlanDocumentData, ResetPresentationPlanDocumentResponses, SearchData, SearchJusticeContactData, SearchJusticeContactResponses, SearchMagistratAuthorizationData, SearchMagistratAuthorizationErrors, SearchMagistratAuthorizationResponses, SearchMagistratsData, SearchMagistratsResponses, SearchNominationFileMembersReportData, SearchNominationFileMembersReportResponses, SearchResponses, SearchSummaryReadersData, SearchSummaryReadersResponses, UnPresentPlanData, UnPresentPlanResponses, UpdateAgendaFilesData, UpdateAgendaFilesResponses, UpdateAgendaMetadataData, UpdateAgendaMetadataResponses, UpdateDisplayTitle2Data, UpdateDisplayTitle2Responses, UpdateDisplayTitleData, UpdateDisplayTitleResponses, UpdateEmailData, UpdateEmailResponses, UpdateJusticePresentationPlanData, UpdateJusticePresentationPlanResponses, UpdateNominationFileAuditionDateData, UpdateNominationFileAuditionDateResponses, UpdateNominationFileCommentData, UpdateNominationFileCommentResponses, UpdateNominationFileMissingEvaluationCommentData, UpdateNominationFileMissingEvaluationCommentResponses, UpdateNominationFileMissingEvaluationData, UpdateNominationFileMissingEvaluationResponses, UpdateNominationSessionData, UpdateNominationSessionResponses, UpdateObservationData, UpdateObservationResponses, UpdateOfficialReportData, UpdateOfficialReportResponses, UpdatePasswordData, UpdatePasswordResponses, UpdatePresentationPlanHtmlData, UpdatePresentationPlanHtmlResponses, UpdateReportData, UpdateReportResponses, UpdateReportRuleValidationData, UpdateReportRuleValidationResponses, UpdateRoleData, UpdateRoleResponses, UpdateSessionObserversData, UpdateSessionObserversResponses, UpdateSummaryReadersListData, UpdateSummaryReadersListResponses, UpdateTitleData, UpdateTitleResponses, UploadNominationFileAttachmentsData, UploadNominationFileAttachmentsResponses, UploadSessionAttachmentsData, UploadSessionAttachmentsResponses, ValidateSessionData, ValidateSessionResponses, WriteMemberCommentData, WriteMemberCommentResponses, WriteNominationFileMemberMemoData, WriteNominationFileMemberMemoResponses, WriteSummaryData, WriteSummaryResponses } from './types.ts';

export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean, TResponse = unknown> = Options2<TData, ThrowOnError, TResponse> & {
    /**
     * You can provide a client instance returned by `createClient()` instead of
     * individual options. This might be also useful if you want to implement a
     * custom client.
     */
    client?: Client;
    /**
     * You can pass arbitrary values through the `meta` object. This can be
     * used to access values that aren't defined as part of the SDK function.
     */
    meta?: keyof ClientMeta extends never ? Record<string, unknown> : ClientMeta;
};

export class files {
    public static getFileByFileUrl<ThrowOnError extends boolean = false>(options: Options<GetFileByFileUrlData, ThrowOnError>): RequestResult<GetFileByFileUrlResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<GetFileByFileUrlResponses, unknown, ThrowOnError>({ url: '/api/files/v1/{fileUrlId}', ...options });
    }
}

export class auth {
    public static login<ThrowOnError extends boolean = false>(options?: Options<LoginData, ThrowOnError>): RequestResult<LoginResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).post<LoginResponses, unknown, ThrowOnError>({
            security: [{ scheme: 'basic', type: 'http' }],
            url: '/api/auth/v2/login',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers
            }
        });
    }
    
    public static introspectSession<ThrowOnError extends boolean = false>(options?: Options<IntrospectSessionData, ThrowOnError>): RequestResult<IntrospectSessionResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<IntrospectSessionResponses, unknown, ThrowOnError>({ url: '/api/auth/v2/introspect', ...options });
    }
    
    public static logout<ThrowOnError extends boolean = false>(options?: Options<LogoutData, ThrowOnError>): RequestResult<LogoutResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).post<LogoutResponses, unknown, ThrowOnError>({ url: '/api/auth/v2/logout', ...options });
    }
    
    public static impersonate<ThrowOnError extends boolean = false>(options: Options<ImpersonateData, ThrowOnError>): RequestResult<ImpersonateResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<ImpersonateResponses, unknown, ThrowOnError>({ url: '/api/auth/v2/users/{userId}/impersonations', ...options });
    }
    
    public static listOpenIdProviders<ThrowOnError extends boolean = false>(options?: Options<ListOpenIdProvidersData, ThrowOnError>): RequestResult<ListOpenIdProvidersResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<ListOpenIdProvidersResponses, unknown, ThrowOnError>({ url: '/api/auth/v2/openid/providers', ...options });
    }
    
    public static prepareOpenIdRequest<ThrowOnError extends boolean = false>(options: Options<PrepareOpenIdRequestData, ThrowOnError>): RequestResult<PrepareOpenIdRequestResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<PrepareOpenIdRequestResponses, unknown, ThrowOnError>({ url: '/api/auth/v2/openid/{provider}/requests', ...options });
    }
    
    public static callback<ThrowOnError extends boolean = false>(options: Options<CallbackData, ThrowOnError>): RequestResult<CallbackResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<CallbackResponses, unknown, ThrowOnError>({ url: '/api/auth/v2/openid/{provider}/callback', ...options });
    }
}

export class reports {
    public static detachFiles<ThrowOnError extends boolean = false>(options: Options<DetachFilesData, ThrowOnError>): RequestResult<DetachFilesResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<DetachFilesResponses, unknown, ThrowOnError>({ url: '/api/reports/v2/{reportId}/files', ...options });
    }
    
    public static attachFiles<ThrowOnError extends boolean = false>(options: Options<AttachFilesData, ThrowOnError>): RequestResult<AttachFilesResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<AttachFilesResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/reports/v2/{reportId}/files',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
    
    public static attachScreenshots<ThrowOnError extends boolean = false>(options: Options<AttachScreenshotsData, ThrowOnError>): RequestResult<AttachScreenshotsResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<AttachScreenshotsResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/reports/v2/{reportId}/screenshots',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
    
    public static getReportFilesUrl<ThrowOnError extends boolean = false>(options: Options<GetReportFilesUrlData, ThrowOnError>): RequestResult<GetReportFilesUrlResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<GetReportFilesUrlResponses, unknown, ThrowOnError>({ url: '/api/reports/v2/{reportId}/files/url', ...options });
    }
    
    public static detailReport<ThrowOnError extends boolean = false>(options: Options<DetailReportData, ThrowOnError>): RequestResult<DetailReportResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailReportResponses, unknown, ThrowOnError>({ url: '/api/reports/v2/{reportId}', ...options });
    }
    
    public static updateReport<ThrowOnError extends boolean = false>(options: Options<UpdateReportData, ThrowOnError>): RequestResult<UpdateReportResponses, unknown, ThrowOnError> {
        return (options.client ?? client).patch<UpdateReportResponses, unknown, ThrowOnError>({
            url: '/api/reports/v2/{reportId}',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateReportRuleValidation<ThrowOnError extends boolean = false>(options: Options<UpdateReportRuleValidationData, ThrowOnError>): RequestResult<UpdateReportRuleValidationResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdateReportRuleValidationResponses, unknown, ThrowOnError>({
            url: '/api/reports/v2/{reportId}/rules/{ruleId}',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
}

export class ingest {
    public static ingestLolfiArchive<ThrowOnError extends boolean = false>(options: Options<IngestLolfiArchiveData, ThrowOnError>): RequestResult<IngestLolfiArchiveResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<IngestLolfiArchiveResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/ingest/v1/lolfi',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
}

export class jobs {
    public static listJobs<ThrowOnError extends boolean = false>(options?: Options<ListJobsData, ThrowOnError>): RequestResult<ListJobsResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<ListJobsResponses, unknown, ThrowOnError>({ url: '/api/jobs/v1', ...options });
    }
    
    public static detailsJob<ThrowOnError extends boolean = false>(options: Options<DetailsJobData, ThrowOnError>): RequestResult<DetailsJobResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailsJobResponses, unknown, ThrowOnError>({ url: '/api/jobs/v1/{jobId}', ...options });
    }
}

export class sessions {
    public static listSessionsOfTypeGardeDesSceaux<ThrowOnError extends boolean = false>(options?: Options<ListSessionsOfTypeGardeDesSceauxData, ThrowOnError>): RequestResult<ListSessionsOfTypeGardeDesSceauxResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<ListSessionsOfTypeGardeDesSceauxResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/garde-des-sceaux', ...options });
    }
    
    public static countUsersNewSessions<ThrowOnError extends boolean = false>(options?: Options<CountUsersNewSessionsData, ThrowOnError>): RequestResult<CountUsersNewSessionsResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<CountUsersNewSessionsResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/new/count', ...options });
    }
    
    public static validateSession<ThrowOnError extends boolean = false>(options: Options<ValidateSessionData, ThrowOnError>): RequestResult<ValidateSessionResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<ValidateSessionResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/validation', ...options });
    }
    
    public static archiveSession<ThrowOnError extends boolean = false>(options: Options<ArchiveSessionData, ThrowOnError>): RequestResult<ArchiveSessionResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<ArchiveSessionResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/archive', ...options });
    }
    
    public static createSessionFromLodam<ThrowOnError extends boolean = false>(options: Options<CreateSessionFromLodamData, ThrowOnError>): RequestResult<CreateSessionFromLodamResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<CreateSessionFromLodamResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/sessions/v2/lodam',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
    
    public static updateSessionObservers<ThrowOnError extends boolean = false>(options: Options<UpdateSessionObserversData, ThrowOnError>): RequestResult<UpdateSessionObserversResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<UpdateSessionObserversResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/sessions/v2/lodam/{sessionId}/observers',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
    
    public static affectReporters<ThrowOnError extends boolean = false>(options: Options<AffectReportersData, ThrowOnError>): RequestResult<AffectReportersResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<AffectReportersResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/reporters',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static listNominationFilesAsExcel<ThrowOnError extends boolean = false>(options: Options<ListNominationFilesAsExcelData, ThrowOnError>): RequestResult<ListNominationFilesAsExcelResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<ListNominationFilesAsExcelResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files.xlsx', ...options });
    }
    
    public static listMissingEvaluationsAsExcel<ThrowOnError extends boolean = false>(options: Options<ListMissingEvaluationsAsExcelData, ThrowOnError>): RequestResult<ListMissingEvaluationsAsExcelResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<ListMissingEvaluationsAsExcelResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/missing-evaluations.xlsx', ...options });
    }
    
    public static listNominationFiles<ThrowOnError extends boolean = false>(options: Options<ListNominationFilesData, ThrowOnError>): RequestResult<ListNominationFilesResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<ListNominationFilesResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files', ...options });
    }
    
    public static detailNominationSessionAffectationsVersion<ThrowOnError extends boolean = false>(options: Options<DetailNominationSessionAffectationsVersionData, ThrowOnError>): RequestResult<DetailNominationSessionAffectationsVersionResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailNominationSessionAffectationsVersionResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/reporters/versions/last', ...options });
    }
    
    public static countUnaffectedNominationFiles<ThrowOnError extends boolean = false>(options: Options<CountUnaffectedNominationFilesData, ThrowOnError>): RequestResult<CountUnaffectedNominationFilesResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<CountUnaffectedNominationFilesResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/reporters/versions/last/unaffected-count', ...options });
    }
    
    public static countNominationFilesByStatus<ThrowOnError extends boolean = false>(options: Options<CountNominationFilesByStatusData, ThrowOnError>): RequestResult<CountNominationFilesByStatusResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<CountNominationFilesByStatusResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/status-counts', ...options });
    }
    
    public static listCurrentlyAffectedReporters<ThrowOnError extends boolean = false>(options: Options<ListCurrentlyAffectedReportersData, ThrowOnError>): RequestResult<ListCurrentlyAffectedReportersResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<ListCurrentlyAffectedReportersResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/reporters/versions/last/members', ...options });
    }
    
    public static publishNominationSessionAffectationsVersion<ThrowOnError extends boolean = false>(options: Options<PublishNominationSessionAffectationsVersionData, ThrowOnError>): RequestResult<PublishNominationSessionAffectationsVersionResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<PublishNominationSessionAffectationsVersionResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/reporters/versions', ...options });
    }
    
    public static autoAffectation<ThrowOnError extends boolean = false>(options: Options<AutoAffectationData, ThrowOnError>): RequestResult<AutoAffectationResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<AutoAffectationResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/auto-affectation',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateNominationFileComment<ThrowOnError extends boolean = false>(options: Options<UpdateNominationFileCommentData, ThrowOnError>): RequestResult<UpdateNominationFileCommentResponses, unknown, ThrowOnError> {
        return (options.client ?? client).patch<UpdateNominationFileCommentResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/comment',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateNominationFileMissingEvaluation<ThrowOnError extends boolean = false>(options: Options<UpdateNominationFileMissingEvaluationData, ThrowOnError>): RequestResult<UpdateNominationFileMissingEvaluationResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdateNominationFileMissingEvaluationResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/missing-evaluation',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateNominationFileMissingEvaluationComment<ThrowOnError extends boolean = false>(options: Options<UpdateNominationFileMissingEvaluationCommentData, ThrowOnError>): RequestResult<UpdateNominationFileMissingEvaluationCommentResponses, unknown, ThrowOnError> {
        return (options.client ?? client).patch<UpdateNominationFileMissingEvaluationCommentResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/missing-evaluation/comment',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateNominationFileAuditionDate<ThrowOnError extends boolean = false>(options: Options<UpdateNominationFileAuditionDateData, ThrowOnError>): RequestResult<UpdateNominationFileAuditionDateResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdateNominationFileAuditionDateResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/audition/schedule',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static defineNominationFileOutcome<ThrowOnError extends boolean = false>(options: Options<DefineNominationFileOutcomeData, ThrowOnError>): RequestResult<DefineNominationFileOutcomeResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<DefineNominationFileOutcomeResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/outcome',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static hideNominationFileAlert<ThrowOnError extends boolean = false>(options: Options<HideNominationFileAlertData, ThrowOnError>): RequestResult<HideNominationFileAlertResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<HideNominationFileAlertResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/file/{nominationFileId}/alert', ...options });
    }
    
    public static uploadSessionAttachments<ThrowOnError extends boolean = false>(options: Options<UploadSessionAttachmentsData, ThrowOnError>): RequestResult<UploadSessionAttachmentsResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UploadSessionAttachmentsResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/sessions/v2/{sessionId}/multiattachments',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
    
    public static removeSessionAttachment<ThrowOnError extends boolean = false>(options: Options<RemoveSessionAttachmentData, ThrowOnError>): RequestResult<RemoveSessionAttachmentResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<RemoveSessionAttachmentResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/attachments/{fileId}', ...options });
    }
    
    public static createNominationSessionAttachmentUrl<ThrowOnError extends boolean = false>(options: Options<CreateNominationSessionAttachmentUrlData, ThrowOnError>): RequestResult<CreateNominationSessionAttachmentUrlResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<CreateNominationSessionAttachmentUrlResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/attachments/{fileId}', ...options });
    }
    
    public static listNominationSessionAttachments<ThrowOnError extends boolean = false>(options: Options<ListNominationSessionAttachmentsData, ThrowOnError>): RequestResult<ListNominationSessionAttachmentsResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<ListNominationSessionAttachmentsResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/attachments', ...options });
    }
    
    public static listNominationFileAttachments<ThrowOnError extends boolean = false>(options: Options<ListNominationFileAttachmentsData, ThrowOnError>): RequestResult<ListNominationFileAttachmentsResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<ListNominationFileAttachmentsResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/attachments', ...options });
    }
    
    public static uploadNominationFileAttachments<ThrowOnError extends boolean = false>(options: Options<UploadNominationFileAttachmentsData, ThrowOnError>): RequestResult<UploadNominationFileAttachmentsResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UploadNominationFileAttachmentsResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/attachments',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
    
    public static removeNominationFileAttachment<ThrowOnError extends boolean = false>(options: Options<RemoveNominationFileAttachmentData, ThrowOnError>): RequestResult<RemoveNominationFileAttachmentResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<RemoveNominationFileAttachmentResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/attachments/{fileId}', ...options });
    }
    
    public static createNominationFileAttachmentUrl<ThrowOnError extends boolean = false>(options: Options<CreateNominationFileAttachmentUrlData, ThrowOnError>): RequestResult<CreateNominationFileAttachmentUrlResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<CreateNominationFileAttachmentUrlResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/attachments/{fileId}', ...options });
    }
    
    public static detailNominationFile<ThrowOnError extends boolean = false>(options: Options<DetailNominationFileData, ThrowOnError>): RequestResult<DetailNominationFileResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailNominationFileResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}', ...options });
    }
    
    public static deleteNominationSession<ThrowOnError extends boolean = false>(options: Options<DeleteNominationSessionData, ThrowOnError>): RequestResult<DeleteNominationSessionResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<DeleteNominationSessionResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}', ...options });
    }
    
    public static detailsNominationSession<ThrowOnError extends boolean = false>(options: Options<DetailsNominationSessionData, ThrowOnError>): RequestResult<DetailsNominationSessionResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailsNominationSessionResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}', ...options });
    }
    
    public static updateNominationSession<ThrowOnError extends boolean = false>(options: Options<UpdateNominationSessionData, ThrowOnError>): RequestResult<UpdateNominationSessionResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdateNominationSessionResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static getLolfiMagistratUrl<ThrowOnError extends boolean = false>(options: Options<GetLolfiMagistratUrlData, ThrowOnError>): RequestResult<GetLolfiMagistratUrlResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<GetLolfiMagistratUrlResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/lolfi-url', ...options });
    }
}

export class summaries {
    public static detailSummary<ThrowOnError extends boolean = false>(options: Options<DetailSummaryData, ThrowOnError>): RequestResult<DetailSummaryResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailSummaryResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary', ...options });
    }
    
    public static createSummary<ThrowOnError extends boolean = false>(options: Options<CreateSummaryData, ThrowOnError>): RequestResult<CreateSummaryResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<CreateSummaryResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary', ...options });
    }
    
    public static detachSummaryFiles<ThrowOnError extends boolean = false>(options: Options<DetachSummaryFilesData, ThrowOnError>): RequestResult<DetachSummaryFilesResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<DetachSummaryFilesResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/attachments', ...options });
    }
    
    public static attachSummaryFiles<ThrowOnError extends boolean = false>(options: Options<AttachSummaryFilesData, ThrowOnError>): RequestResult<AttachSummaryFilesResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<AttachSummaryFilesResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/attachments',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
    
    public static includeFilesInContent<ThrowOnError extends boolean = false>(options: Options<IncludeFilesInContentData, ThrowOnError>): RequestResult<IncludeFilesInContentResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<IncludeFilesInContentResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/screenshots',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
    
    public static writeSummary<ThrowOnError extends boolean = false>(options: Options<WriteSummaryData, ThrowOnError>): RequestResult<WriteSummaryResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<WriteSummaryResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/content',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static searchSummaryReaders<ThrowOnError extends boolean = false>(options: Options<SearchSummaryReadersData, ThrowOnError>): RequestResult<SearchSummaryReadersResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<SearchSummaryReadersResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/readers', ...options });
    }
    
    public static updateSummaryReadersList<ThrowOnError extends boolean = false>(options: Options<UpdateSummaryReadersListData, ThrowOnError>): RequestResult<UpdateSummaryReadersListResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdateSummaryReadersListResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/readers',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static generateAttachmentPublicUrl<ThrowOnError extends boolean = false>(options: Options<GenerateAttachmentPublicUrlData, ThrowOnError>): RequestResult<GenerateAttachmentPublicUrlResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<GenerateAttachmentPublicUrlResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/attachments/{fileId}/url', ...options });
    }
}

export class members {
    public static listMembers<ThrowOnError extends boolean = false>(options?: Options<ListMembersData, ThrowOnError>): RequestResult<ListMembersResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<ListMembersResponses, unknown, ThrowOnError>({ url: '/api/members/v1', ...options });
    }
    
    public static detailsMember<ThrowOnError extends boolean = false>(options: Options<DetailsMemberData, ThrowOnError>): RequestResult<DetailsMemberResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailsMemberResponses, unknown, ThrowOnError>({ url: '/api/members/v1/{userId}', ...options });
    }
    
    public static excludeJurisdictions<ThrowOnError extends boolean = false>(options: Options<ExcludeJurisdictionsData, ThrowOnError>): RequestResult<ExcludeJurisdictionsResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<ExcludeJurisdictionsResponses, unknown, ThrowOnError>({
            url: '/api/members/v1/{userId}/excluded-jurisdictions',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateDisplayTitle<ThrowOnError extends boolean = false>(options: Options<UpdateDisplayTitleData, ThrowOnError>): RequestResult<UpdateDisplayTitleResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdateDisplayTitleResponses, unknown, ThrowOnError>({
            url: '/api/members/v1/{userId}/display-title',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateTitle<ThrowOnError extends boolean = false>(options: Options<UpdateTitleData, ThrowOnError>): RequestResult<UpdateTitleResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdateTitleResponses, unknown, ThrowOnError>({
            url: '/api/members/v1/{userId}/title',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static listMemberSessions<ThrowOnError extends boolean = false>(options: Options<ListMemberSessionsData, ThrowOnError>): RequestResult<ListMemberSessionsResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<ListMemberSessionsResponses, unknown, ThrowOnError>({ url: '/api/members/v1/{userId}/sessions/transparence/garde-des-sceaux', ...options });
    }
    
    public static listMemberSessionReports<ThrowOnError extends boolean = false>(options: Options<ListMemberSessionReportsData, ThrowOnError>): RequestResult<ListMemberSessionReportsResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<ListMemberSessionReportsResponses, unknown, ThrowOnError>({ url: '/api/members/v1/{userId}/sessions/transparence/garde-des-sceaux/{sessionId}/reports', ...options });
    }
    
    public static searchNominationFileMembersReport<ThrowOnError extends boolean = false>(options: Options<SearchNominationFileMembersReportData, ThrowOnError>): RequestResult<SearchNominationFileMembersReportResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<SearchNominationFileMembersReportResponses, unknown, ThrowOnError>({ url: '/api/members/v1/{userId}/sessions/transparence/garde-des-sceaux/{sessionId}/files/{nominationFileId}/reports', ...options });
    }
    
    public static writeNominationFileMemberMemo<ThrowOnError extends boolean = false>(options: Options<WriteNominationFileMemberMemoData, ThrowOnError>): RequestResult<WriteNominationFileMemberMemoResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<WriteNominationFileMemberMemoResponses, unknown, ThrowOnError>({
            url: '/api/members/v1/{userId}/sessions/transparence/garde-des-sceaux/{sessionId}/files/{nominationFileId}/memo',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
}

export class jurisdictions {
    public static search<ThrowOnError extends boolean = false>(options?: Options<SearchData, ThrowOnError>): RequestResult<SearchResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<SearchResponses, unknown, ThrowOnError>({ url: '/api/jurisdictions/v1', ...options });
    }
}

export class magistrats {
    public static searchMagistratAuthorization<ThrowOnError extends boolean = false>(options: Options<SearchMagistratAuthorizationData, ThrowOnError>): RequestResult<SearchMagistratAuthorizationResponses, SearchMagistratAuthorizationErrors, ThrowOnError> {
        return (options.client ?? client).post<SearchMagistratAuthorizationResponses, SearchMagistratAuthorizationErrors, ThrowOnError>({
            security: [{ scheme: 'bearer', type: 'http' }],
            url: '/api/public/v1/magistrats/role',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static searchMagistrats<ThrowOnError extends boolean = false>(options?: Options<SearchMagistratsData, ThrowOnError>): RequestResult<SearchMagistratsResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<SearchMagistratsResponses, unknown, ThrowOnError>({ url: '/api/magistrats/v1', ...options });
    }
    
    public static detailMagistrat<ThrowOnError extends boolean = false>(options: Options<DetailMagistratData, ThrowOnError>): RequestResult<DetailMagistratResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailMagistratResponses, unknown, ThrowOnError>({ url: '/api/magistrats/v1/{magistratId}', ...options });
    }
    
    public static listMagistratNominationFiles<ThrowOnError extends boolean = false>(options: Options<ListMagistratNominationFilesData, ThrowOnError>): RequestResult<ListMagistratNominationFilesResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<ListMagistratNominationFilesResponses, unknown, ThrowOnError>({ url: '/api/magistrats/v1/{magistratId}/nomination-files', ...options });
    }
    
    public static listMagistratObservations<ThrowOnError extends boolean = false>(options: Options<ListMagistratObservationsData, ThrowOnError>): RequestResult<ListMagistratObservationsResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<ListMagistratObservationsResponses, unknown, ThrowOnError>({ url: '/api/magistrats/v1/{magistratId}/observations', ...options });
    }
}

export class docs {
    public static listSecretariesGeneral<ThrowOnError extends boolean = false>(options?: Options<ListSecretariesGeneralData, ThrowOnError>): RequestResult<ListSecretariesGeneralResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<ListSecretariesGeneralResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/secretaries-general', ...options });
    }
    
    public static searchJusticeContact<ThrowOnError extends boolean = false>(options?: Options<SearchJusticeContactData, ThrowOnError>): RequestResult<SearchJusticeContactResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<SearchJusticeContactResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/justice-contacts', ...options });
    }
    
    public static createJusticeContact<ThrowOnError extends boolean = false>(options: Options<CreateJusticeContactData, ThrowOnError>): RequestResult<CreateJusticeContactResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<CreateJusticeContactResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/justice-contacts',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static findDocsMembers<ThrowOnError extends boolean = false>(options: Options<FindDocsMembersData, ThrowOnError>): RequestResult<FindDocsMembersResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<FindDocsMembersResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/members', ...options });
    }
    
    public static findSessionDocs<ThrowOnError extends boolean = false>(options: Options<FindSessionDocsData, ThrowOnError>): RequestResult<FindSessionDocsResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<FindSessionDocsResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/sessions/{sessionId}/docs', ...options });
    }
    
    public static isSessionReadyForDocGeneration<ThrowOnError extends boolean = false>(options: Options<IsSessionReadyForDocGenerationData, ThrowOnError>): RequestResult<IsSessionReadyForDocGenerationResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<IsSessionReadyForDocGenerationResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/sessions/{sessionId}/readiness', ...options });
    }
    
    public static findAgendaNominationFiles<ThrowOnError extends boolean = false>(options: Options<FindAgendaNominationFilesData, ThrowOnError>): RequestResult<FindAgendaNominationFilesResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<FindAgendaNominationFilesResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/sessions/{sessionId}/files', ...options });
    }
    
    public static createAgenda<ThrowOnError extends boolean = false>(options: Options<CreateAgendaData, ThrowOnError>): RequestResult<CreateAgendaResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<CreateAgendaResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/sessions/{sessionId}/agendas',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateAgendaMetadata<ThrowOnError extends boolean = false>(options: Options<UpdateAgendaMetadataData, ThrowOnError>): RequestResult<UpdateAgendaMetadataResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdateAgendaMetadataResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/agendas/{agendaId}/metadata',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static detailsAgendaFiles<ThrowOnError extends boolean = false>(options: Options<DetailsAgendaFilesData, ThrowOnError>): RequestResult<DetailsAgendaFilesResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailsAgendaFilesResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/agendas/{agendaId}/files', ...options });
    }
    
    public static updateAgendaFiles<ThrowOnError extends boolean = false>(options: Options<UpdateAgendaFilesData, ThrowOnError>): RequestResult<UpdateAgendaFilesResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdateAgendaFilesResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/agendas/{agendaId}/files',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static detailsSessionAgenda<ThrowOnError extends boolean = false>(options: Options<DetailsSessionAgendaData, ThrowOnError>): RequestResult<DetailsSessionAgendaResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailsSessionAgendaResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/sessions/{sessionId}/agendas/{agendaId}', ...options });
    }
    
    public static generateAgendaHtml<ThrowOnError extends boolean = false>(options: Options<GenerateAgendaHtmlData, ThrowOnError>): RequestResult<GenerateAgendaHtmlResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<GenerateAgendaHtmlResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/agendas/{agendaId}.html', ...options });
    }
    
    public static generateAgendaPdf<ThrowOnError extends boolean = false>(options: Options<GenerateAgendaPdfData, ThrowOnError>): RequestResult<GenerateAgendaPdfResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<GenerateAgendaPdfResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/agendas/{agendaId}.pdf', ...options });
    }
    
    public static deleteAgenda<ThrowOnError extends boolean = false>(options: Options<DeleteAgendaData, ThrowOnError>): RequestResult<DeleteAgendaResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<DeleteAgendaResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/agendas/{agendaId}', ...options });
    }
    
    public static detailsAgendaMetadata<ThrowOnError extends boolean = false>(options: Options<DetailsAgendaMetadataData, ThrowOnError>): RequestResult<DetailsAgendaMetadataResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailsAgendaMetadataResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/agendas/{agendaId}', ...options });
    }
    
    public static detailsAgendaDocumentBlocks<ThrowOnError extends boolean = false>(options: Options<DetailsAgendaDocumentBlocksData, ThrowOnError>): RequestResult<DetailsAgendaDocumentBlocksResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailsAgendaDocumentBlocksResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/agendas/{agendaId}/blocks', ...options });
    }
    
    public static resetAgendaFileBlock<ThrowOnError extends boolean = false>(options: Options<ResetAgendaFileBlockData, ThrowOnError>): RequestResult<ResetAgendaFileBlockResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<ResetAgendaFileBlockResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/agendas/{agendaId}/blocks/files/{fileId}', ...options });
    }
    
    public static editAgendaFileBlock<ThrowOnError extends boolean = false>(options: Options<EditAgendaFileBlockData, ThrowOnError>): RequestResult<EditAgendaFileBlockResponses, unknown, ThrowOnError> {
        return (options.client ?? client).patch<EditAgendaFileBlockResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/agendas/{agendaId}/blocks/files/{fileId}',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static resetAgendaDocument<ThrowOnError extends boolean = false>(options: Options<ResetAgendaDocumentData, ThrowOnError>): RequestResult<ResetAgendaDocumentResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<ResetAgendaDocumentResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/agendas/{agendaId}/document', ...options });
    }
    
    public static detailsSessionOfficialReport<ThrowOnError extends boolean = false>(options: Options<DetailsSessionOfficialReportData, ThrowOnError>): RequestResult<DetailsSessionOfficialReportResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailsSessionOfficialReportResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/sessions/{sessionId}/official-reports/{officialReportId}', ...options });
    }
    
    public static createOfficialReport<ThrowOnError extends boolean = false>(options: Options<CreateOfficialReportData, ThrowOnError>): RequestResult<CreateOfficialReportResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<CreateOfficialReportResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/sessions/{sessionId}/official-reports',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static listAgendasForNewOfficialReport<ThrowOnError extends boolean = false>(options: Options<ListAgendasForNewOfficialReportData, ThrowOnError>): RequestResult<ListAgendasForNewOfficialReportResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<ListAgendasForNewOfficialReportResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/sessions/{sessionId}/new-official-reports/agendas', ...options });
    }
    
    public static generateOfficialReportHtml<ThrowOnError extends boolean = false>(options: Options<GenerateOfficialReportHtmlData, ThrowOnError>): RequestResult<GenerateOfficialReportHtmlResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<GenerateOfficialReportHtmlResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}.html', ...options });
    }
    
    public static generateOfficialReportPdf<ThrowOnError extends boolean = false>(options: Options<GenerateOfficialReportPdfData, ThrowOnError>): RequestResult<GenerateOfficialReportPdfResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<GenerateOfficialReportPdfResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}.pdf', ...options });
    }
    
    public static deleteOfficialReport<ThrowOnError extends boolean = false>(options: Options<DeleteOfficialReportData, ThrowOnError>): RequestResult<DeleteOfficialReportResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<DeleteOfficialReportResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}', ...options });
    }
    
    public static detailsOfficialReport<ThrowOnError extends boolean = false>(options: Options<DetailsOfficialReportData, ThrowOnError>): RequestResult<DetailsOfficialReportResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailsOfficialReportResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}', ...options });
    }
    
    public static updateOfficialReport<ThrowOnError extends boolean = false>(options: Options<UpdateOfficialReportData, ThrowOnError>): RequestResult<UpdateOfficialReportResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdateOfficialReportResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/official-reports/{officialReportId}',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static detailsOfficialReportDocument<ThrowOnError extends boolean = false>(options: Options<DetailsOfficialReportDocumentData, ThrowOnError>): RequestResult<DetailsOfficialReportDocumentResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailsOfficialReportDocumentResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}/blocks', ...options });
    }
    
    public static resetOfficialReportIntro<ThrowOnError extends boolean = false>(options: Options<ResetOfficialReportIntroData, ThrowOnError>): RequestResult<ResetOfficialReportIntroResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<ResetOfficialReportIntroResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}/blocks/intro', ...options });
    }
    
    public static editOfficialReportIntro<ThrowOnError extends boolean = false>(options: Options<EditOfficialReportIntroData, ThrowOnError>): RequestResult<EditOfficialReportIntroResponses, unknown, ThrowOnError> {
        return (options.client ?? client).patch<EditOfficialReportIntroResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/official-reports/{officialReportId}/blocks/intro',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static resetOfficialReportConclusion<ThrowOnError extends boolean = false>(options: Options<ResetOfficialReportConclusionData, ThrowOnError>): RequestResult<ResetOfficialReportConclusionResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<ResetOfficialReportConclusionResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}/blocks/conclusion', ...options });
    }
    
    public static editOfficialReportConclusion<ThrowOnError extends boolean = false>(options: Options<EditOfficialReportConclusionData, ThrowOnError>): RequestResult<EditOfficialReportConclusionResponses, unknown, ThrowOnError> {
        return (options.client ?? client).patch<EditOfficialReportConclusionResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/official-reports/{officialReportId}/blocks/conclusion',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static resetOfficialReportSectionTitle<ThrowOnError extends boolean = false>(options: Options<ResetOfficialReportSectionTitleData, ThrowOnError>): RequestResult<ResetOfficialReportSectionTitleResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<ResetOfficialReportSectionTitleResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}/blocks/{outcome}/title', ...options });
    }
    
    public static editOfficialReportSectionTitle<ThrowOnError extends boolean = false>(options: Options<EditOfficialReportSectionTitleData, ThrowOnError>): RequestResult<EditOfficialReportSectionTitleResponses, unknown, ThrowOnError> {
        return (options.client ?? client).patch<EditOfficialReportSectionTitleResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/official-reports/{officialReportId}/blocks/{outcome}/title',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static resetOfficialReportSectionIntro<ThrowOnError extends boolean = false>(options: Options<ResetOfficialReportSectionIntroData, ThrowOnError>): RequestResult<ResetOfficialReportSectionIntroResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<ResetOfficialReportSectionIntroResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}/blocks/{outcome}/intro', ...options });
    }
    
    public static editOfficialReportSectionIntro<ThrowOnError extends boolean = false>(options: Options<EditOfficialReportSectionIntroData, ThrowOnError>): RequestResult<EditOfficialReportSectionIntroResponses, unknown, ThrowOnError> {
        return (options.client ?? client).patch<EditOfficialReportSectionIntroResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/official-reports/{officialReportId}/blocks/{outcome}/intro',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static resetOfficialReportFile<ThrowOnError extends boolean = false>(options: Options<ResetOfficialReportFileData, ThrowOnError>): RequestResult<ResetOfficialReportFileResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<ResetOfficialReportFileResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}/blocks/files/{nominationFileId}', ...options });
    }
    
    public static editOfficialReportFile<ThrowOnError extends boolean = false>(options: Options<EditOfficialReportFileData, ThrowOnError>): RequestResult<EditOfficialReportFileResponses, unknown, ThrowOnError> {
        return (options.client ?? client).patch<EditOfficialReportFileResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/official-reports/{officialReportId}/blocks/files/{nominationFileId}',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static resetOfficialReportDocument<ThrowOnError extends boolean = false>(options: Options<ResetOfficialReportDocumentData, ThrowOnError>): RequestResult<ResetOfficialReportDocumentResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<ResetOfficialReportDocumentResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}/document', ...options });
    }
    
    public static listPresentationPlanAgendas<ThrowOnError extends boolean = false>(options?: Options<ListPresentationPlanAgendasData, ThrowOnError>): RequestResult<ListPresentationPlanAgendasResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<ListPresentationPlanAgendasResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/agendas', ...options });
    }
    
    public static generatePresentationPlanHtml<ThrowOnError extends boolean = false>(options: Options<GeneratePresentationPlanHtmlData, ThrowOnError>): RequestResult<GeneratePresentationPlanHtmlResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<GeneratePresentationPlanHtmlResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/{planId}.html', ...options });
    }
    
    public static generatePresentationPlanPdf<ThrowOnError extends boolean = false>(options: Options<GeneratePresentationPlanPdfData, ThrowOnError>): RequestResult<GeneratePresentationPlanPdfResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<GeneratePresentationPlanPdfResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/{planId}.pdf', ...options });
    }
    
    public static listPresentedPlans<ThrowOnError extends boolean = false>(options?: Options<ListPresentedPlansData, ThrowOnError>): RequestResult<ListPresentedPlansResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<ListPresentedPlansResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/presented', ...options });
    }
    
    public static deleteJusticePresentationPlan<ThrowOnError extends boolean = false>(options: Options<DeleteJusticePresentationPlanData, ThrowOnError>): RequestResult<DeleteJusticePresentationPlanResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<DeleteJusticePresentationPlanResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/{planId}', ...options });
    }
    
    public static detailsPresentationPlanMetadata<ThrowOnError extends boolean = false>(options: Options<DetailsPresentationPlanMetadataData, ThrowOnError>): RequestResult<DetailsPresentationPlanMetadataResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailsPresentationPlanMetadataResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/{planId}', ...options });
    }
    
    public static updateJusticePresentationPlan<ThrowOnError extends boolean = false>(options: Options<UpdateJusticePresentationPlanData, ThrowOnError>): RequestResult<UpdateJusticePresentationPlanResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdateJusticePresentationPlanResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/presentation-plans/{planId}',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static listNonPresentedPlans<ThrowOnError extends boolean = false>(options?: Options<ListNonPresentedPlansData, ThrowOnError>): RequestResult<ListNonPresentedPlansResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<ListNonPresentedPlansResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans', ...options });
    }
    
    public static createJusticePresentationPlan<ThrowOnError extends boolean = false>(options: Options<CreateJusticePresentationPlanData, ThrowOnError>): RequestResult<CreateJusticePresentationPlanResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<CreateJusticePresentationPlanResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/presentation-plans',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static detailsJusticePresentationPlanPdfDocument<ThrowOnError extends boolean = false>(options: Options<DetailsJusticePresentationPlanPdfDocumentData, ThrowOnError>): RequestResult<DetailsJusticePresentationPlanPdfDocumentResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailsJusticePresentationPlanPdfDocumentResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/{planId}/url', ...options });
    }
    
    public static updatePresentationPlanHtml<ThrowOnError extends boolean = false>(options: Options<UpdatePresentationPlanHtmlData, ThrowOnError>): RequestResult<UpdatePresentationPlanHtmlResponses, unknown, ThrowOnError> {
        return (options.client ?? client).patch<UpdatePresentationPlanHtmlResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/docs/v1/presentation-plans/{planId}/html',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
    
    public static resetPresentationPlanDocument<ThrowOnError extends boolean = false>(options: Options<ResetPresentationPlanDocumentData, ThrowOnError>): RequestResult<ResetPresentationPlanDocumentResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<ResetPresentationPlanDocumentResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/{planId}/document', ...options });
    }
    
    public static unPresentPlan<ThrowOnError extends boolean = false>(options: Options<UnPresentPlanData, ThrowOnError>): RequestResult<UnPresentPlanResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<UnPresentPlanResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/{planId}/presentation', ...options });
    }
    
    public static presentPlan<ThrowOnError extends boolean = false>(options: Options<PresentPlanData, ThrowOnError>): RequestResult<PresentPlanResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<PresentPlanResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/presentation-plans/{planId}/presentation',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
}

export class archivedSessions {
    public static listArchivedSessions<ThrowOnError extends boolean = false>(options?: Options<ListArchivedSessionsData, ThrowOnError>): RequestResult<ListArchivedSessionsResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<ListArchivedSessionsResponses, unknown, ThrowOnError>({ url: '/api/archived-sessions/v1', ...options });
    }
}

export class observations {
    public static listObservations<ThrowOnError extends boolean = false>(options: Options<ListObservationsData, ThrowOnError>): RequestResult<ListObservationsResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<ListObservationsResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations', ...options });
    }
    
    public static createObservation<ThrowOnError extends boolean = false>(options: Options<CreateObservationData, ThrowOnError>): RequestResult<CreateObservationResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<CreateObservationResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
    
    public static deleteObservation<ThrowOnError extends boolean = false>(options: Options<DeleteObservationData, ThrowOnError>): RequestResult<DeleteObservationResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<DeleteObservationResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}', ...options });
    }
    
    public static getObservationDetails<ThrowOnError extends boolean = false>(options: Options<GetObservationDetailsData, ThrowOnError>): RequestResult<GetObservationDetailsResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<GetObservationDetailsResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}', ...options });
    }
    
    public static updateObservation<ThrowOnError extends boolean = false>(options: Options<UpdateObservationData, ThrowOnError>): RequestResult<UpdateObservationResponses, unknown, ThrowOnError> {
        return (options.client ?? client).patch<UpdateObservationResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
    
    public static getObservationFileUrl<ThrowOnError extends boolean = false>(options: Options<GetObservationFileUrlData, ThrowOnError>): RequestResult<GetObservationFileUrlResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<GetObservationFileUrlResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}/files/{fileId}/url', ...options });
    }
    
    public static attachMemberCommentScreenshots<ThrowOnError extends boolean = false>(options: Options<AttachMemberCommentScreenshotsData, ThrowOnError>): RequestResult<AttachMemberCommentScreenshotsResponses, unknown, ThrowOnError> {
        return (options.client ?? client).post<AttachMemberCommentScreenshotsResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}/member-comments/screenshots',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
    
    public static writeMemberComment<ThrowOnError extends boolean = false>(options: Options<WriteMemberCommentData, ThrowOnError>): RequestResult<WriteMemberCommentResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<WriteMemberCommentResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}/member-comments',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static followUpOnObservation<ThrowOnError extends boolean = false>(options: Options<FollowUpOnObservationData, ThrowOnError>): RequestResult<FollowUpOnObservationResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<FollowUpOnObservationResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}/follow-up',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static listObservationsAttachments<ThrowOnError extends boolean = false>(options: Options<ListObservationsAttachmentsData, ThrowOnError>): RequestResult<ListObservationsAttachmentsResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<ListObservationsAttachmentsResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/observations/attachments', ...options });
    }
}

export class administration {
    public static listUsers<ThrowOnError extends boolean = false>(options?: Options<ListUsersData, ThrowOnError>): RequestResult<ListUsersResponses, unknown, ThrowOnError> {
        return (options?.client ?? client).get<ListUsersResponses, unknown, ThrowOnError>({ url: '/api/administration/v1/users', ...options });
    }
    
    public static detailsUser<ThrowOnError extends boolean = false>(options: Options<DetailsUserData, ThrowOnError>): RequestResult<DetailsUserResponses, unknown, ThrowOnError> {
        return (options.client ?? client).get<DetailsUserResponses, unknown, ThrowOnError>({ url: '/api/administration/v1/users/{userId}', ...options });
    }
    
    public static updateEmail<ThrowOnError extends boolean = false>(options: Options<UpdateEmailData, ThrowOnError>): RequestResult<UpdateEmailResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdateEmailResponses, unknown, ThrowOnError>({
            url: '/api/administration/v1/users/{userId}/email',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updatePassword<ThrowOnError extends boolean = false>(options: Options<UpdatePasswordData, ThrowOnError>): RequestResult<UpdatePasswordResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdatePasswordResponses, unknown, ThrowOnError>({
            url: '/api/administration/v1/users/{userId}/password',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateRole<ThrowOnError extends boolean = false>(options: Options<UpdateRoleData, ThrowOnError>): RequestResult<UpdateRoleResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdateRoleResponses, unknown, ThrowOnError>({
            url: '/api/administration/v1/users/{userId}/role',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateDisplayTitle<ThrowOnError extends boolean = false>(options: Options<UpdateDisplayTitle2Data, ThrowOnError>): RequestResult<UpdateDisplayTitle2Responses, unknown, ThrowOnError> {
        return (options.client ?? client).put<UpdateDisplayTitle2Responses, unknown, ThrowOnError>({
            url: '/api/administration/v1/users/{userId}/display-title',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static demoteFromAdmin<ThrowOnError extends boolean = false>(options: Options<DemoteFromAdminData, ThrowOnError>): RequestResult<DemoteFromAdminResponses, unknown, ThrowOnError> {
        return (options.client ?? client).delete<DemoteFromAdminResponses, unknown, ThrowOnError>({ url: '/api/administration/v1/users/{userId}/promotion', ...options });
    }
    
    public static promoteToAdmin<ThrowOnError extends boolean = false>(options: Options<PromoteToAdminData, ThrowOnError>): RequestResult<PromoteToAdminResponses, unknown, ThrowOnError> {
        return (options.client ?? client).put<PromoteToAdminResponses, unknown, ThrowOnError>({ url: '/api/administration/v1/users/{userId}/promotion', ...options });
    }
}
