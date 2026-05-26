/* oxlint-disable */
// this file is auto-generated
//
// Licensed under the Apache License, Version 2.0
//

import { client } from './client.ts';
import { type Client, formDataBodySerializer, type Options as Options2, type TDataShape } from './client/index.ts';
import type { AffectReportersData, AffectReportersResponses, AttachFilesData, AttachFilesResponses, AttachMemberCommentScreenshotsData, AttachMemberCommentScreenshotsResponses, AttachScreenshotsData, AttachScreenshotsResponses, AttachSummaryFilesData, AttachSummaryFilesResponses, AutoAffectationData, AutoAffectationResponses, CountNominationFilesByStatusData, CountNominationFilesByStatusResponses, CountUnaffectedNominationFilesData, CountUnaffectedNominationFilesResponses, CountUsersNewSessionsData, CountUsersNewSessionsResponses, CreateAgendaData, CreateAgendaResponses, CreateJusticeContactData, CreateJusticeContactResponses, CreateJusticePresentationPlanData, CreateJusticePresentationPlanResponses, CreateNominationSessionAttachmentUrlData, CreateNominationSessionAttachmentUrlResponses, CreateObservationData, CreateObservationResponses, CreateOfficialReportData, CreateOfficialReportJusticeContactData, CreateOfficialReportJusticeContactResponses, CreateOfficialReportResponses, CreateSessionFromLodamData, CreateSessionFromLodamResponses, CreateSummaryData, CreateSummaryResponses, DefineNominationFileOutcomeData, DefineNominationFileOutcomeResponses, DeleteAgendaData, DeleteAgendaResponses, DeleteJusticePresentationPlanData, DeleteJusticePresentationPlanResponses, DeleteNominationSessionData, DeleteNominationSessionResponses, DeleteObservationData, DeleteObservationResponses, DeleteOfficialReportData, DeleteOfficialReportResponses, DemoteFromAdminData, DemoteFromAdminResponses, DetachFilesData, DetachFilesResponses, DetachSummaryFilesData, DetachSummaryFilesResponses, DetailNominationSessionAffectationsVersionData, DetailNominationSessionAffectationsVersionResponses, DetailReportData, DetailReportResponses, DetailsAgendaFilesData, DetailsAgendaFilesResponses, DetailsAgendaMetadataData, DetailsAgendaMetadataResponses, DetailsJobData, DetailsJobResponses, DetailsJusticePresentationPlanPdfDocumentData, DetailsJusticePresentationPlanPdfDocumentResponses, DetailsMemberData, DetailsMemberResponses, DetailsMemberSessionData, DetailsMemberSessionResponses, DetailsNominationSessionData, DetailsNominationSessionResponses, DetailsOfficialReportData, DetailsOfficialReportResponses, DetailsPresentationPlanMetadataData, DetailsPresentationPlanMetadataResponses, DetailsSessionAgendaData, DetailsSessionAgendaResponses, DetailsSessionDocData, DetailsSessionDocResponses, DetailsSessionOfficialReportData, DetailsSessionOfficialReportResponses, DetailSummaryData, DetailSummaryResponses, DetailsUserData, DetailsUserResponses, ExcludeJurisdictionsData, ExcludeJurisdictionsResponses, FindAgendaNominationFilesData, FindAgendaNominationFilesResponses, FindDocsMembersData, FindDocsMembersResponses, FindSessionDocsData, FindSessionDocsResponses, FollowUpOnObservationData, FollowUpOnObservationResponses, GenerateAgendaHtmlData, GenerateAgendaHtmlResponses, GenerateAgendaPdfData, GenerateAgendaPdfResponses, GenerateAttachmentPublicUrlData, GenerateAttachmentPublicUrlResponses, GenerateOfficialReportHtmlData, GenerateOfficialReportHtmlResponses, GenerateOfficialReportPdfData, GenerateOfficialReportPdfResponses, GeneratePresentationPlanHtmlData, GeneratePresentationPlanHtmlResponses, GeneratePresentationPlanPdfData, GeneratePresentationPlanPdfResponses, GetFileByFileUrlData, GetFileByFileUrlResponses, GetLolfiMagistratUrlData, GetLolfiMagistratUrlResponses, GetObservationDetailsData, GetObservationDetailsResponses, GetObservationFileUrlData, GetObservationFileUrlResponses, GetReportFilesUrlData, GetReportFilesUrlResponses, HideNominationFileAlertData, HideNominationFileAlertResponses, ImpersonateData, ImpersonateResponses, IncludeFilesInContentData, IncludeFilesInContentResponses, IngestLolfiArchiveData, IngestLolfiArchiveResponses, IntrospectSessionData, IntrospectSessionResponses, IsSessionReadyForDocGenerationData, IsSessionReadyForDocGenerationResponses, ListAgendasForNewOfficialReportData, ListAgendasForNewOfficialReportResponses, ListCurrentlyAffectedReportersData, ListCurrentlyAffectedReportersResponses, ListJobsData, ListJobsResponses, ListMembersData, ListMemberSessionsData, ListMemberSessionsResponses, ListMembersForNewOfficialReportData, ListMembersForNewOfficialReportResponses, ListMembersResponses, ListNominationFilesAsExcelData, ListNominationFilesAsExcelResponses, ListNominationFilesData, ListNominationFilesResponses, ListNominationSessionAttachmentsData, ListNominationSessionAttachmentsResponses, ListNonPresentedPlansData, ListNonPresentedPlansResponses, ListObservationsAttachmentsData, ListObservationsAttachmentsResponses, ListObservationsData, ListObservationsResponses, ListPresentationPlanAgendasData, ListPresentationPlanAgendasResponses, ListPresentedPlansData, ListPresentedPlansResponses, ListSecretariesGeneralData, ListSecretariesGeneralResponses, ListSessionsOfTypeGardeDesSceauxData, ListSessionsOfTypeGardeDesSceauxResponses, ListUsersData, ListUsersResponses, LoginData, LoginResponses, LogoutData, LogoutResponses, PresentPlanData, PresentPlanResponses, PromoteToAdminData, PromoteToAdminResponses, PublishNominationSessionAffectationsVersionData, PublishNominationSessionAffectationsVersionResponses, RemoveSessionAttachmentData, RemoveSessionAttachmentResponses, ResetAgendaDocumentData, ResetAgendaDocumentResponses, ResetOfficialReportDocumentData, ResetOfficialReportDocumentResponses, ResetPresentationPlanDocumentData, ResetPresentationPlanDocumentResponses, SearchChairmenData, SearchChairmenResponses, SearchData, SearchFullNameData, SearchFullNameResponses, SearchJusticeContactData, SearchJusticeContactResponses, SearchMagistratsData, SearchMagistratsResponses, SearchOfficialReportJusticeContactData, SearchOfficialReportJusticeContactResponses, SearchResponses, SearchSummaryReadersData, SearchSummaryReadersResponses, UnPresentPlanData, UnPresentPlanResponses, UpdateAgendaData, UpdateAgendaHtmlData, UpdateAgendaHtmlResponses, UpdateAgendaResponses, UpdateDisplayTitle2Data, UpdateDisplayTitle2Responses, UpdateDisplayTitleData, UpdateDisplayTitleResponses, UpdateEmailData, UpdateEmailResponses, UpdateJusticePresentationPlanData, UpdateJusticePresentationPlanResponses, UpdateNominationFileCommentData, UpdateNominationFileCommentResponses, UpdateNominationSessionData, UpdateNominationSessionResponses, UpdateObservationData, UpdateObservationResponses, UpdateOfficialReportData, UpdateOfficialReportHtmlData, UpdateOfficialReportHtmlResponses, UpdateOfficialReportResponses, UpdatePasswordData, UpdatePasswordResponses, UpdatePresentationPlanHtmlData, UpdatePresentationPlanHtmlResponses, UpdateReportData, UpdateReportResponses, UpdateReportRuleValidationData, UpdateReportRuleValidationResponses, UpdateRoleData, UpdateRoleResponses, UpdateSessionObserversData, UpdateSessionObserversResponses, UpdateSummaryReadersListData, UpdateSummaryReadersListResponses, UpdateTitleData, UpdateTitleResponses, UploadSessionAttachmentsData, UploadSessionAttachmentsResponses, ValidateSessionData, ValidateSessionResponses, WriteMemberCommentData, WriteMemberCommentResponses, WriteNominationFileMemberMemoData, WriteNominationFileMemberMemoResponses, WriteSummaryData, WriteSummaryResponses } from './types.ts';

export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> = Options2<TData, ThrowOnError> & {
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
    meta?: Record<string, unknown>;
};

export class files {
    public static getFileByFileUrl<ThrowOnError extends boolean = false>(options: Options<GetFileByFileUrlData, ThrowOnError>) {
        return (options.client ?? client).get<GetFileByFileUrlResponses, unknown, ThrowOnError>({ url: '/api/files/v1/{fileUrlId}', ...options });
    }
}

export class auth {
    public static login<ThrowOnError extends boolean = false>(options?: Options<LoginData, ThrowOnError>) {
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
    
    public static introspectSession<ThrowOnError extends boolean = false>(options?: Options<IntrospectSessionData, ThrowOnError>) {
        return (options?.client ?? client).get<IntrospectSessionResponses, unknown, ThrowOnError>({ url: '/api/auth/v2/introspect', ...options });
    }
    
    public static logout<ThrowOnError extends boolean = false>(options?: Options<LogoutData, ThrowOnError>) {
        return (options?.client ?? client).post<LogoutResponses, unknown, ThrowOnError>({ url: '/api/auth/v2/logout', ...options });
    }
    
    public static impersonate<ThrowOnError extends boolean = false>(options: Options<ImpersonateData, ThrowOnError>) {
        return (options.client ?? client).post<ImpersonateResponses, unknown, ThrowOnError>({ url: '/api/auth/v2/users/{userId}/impersonations', ...options });
    }
}

export class reports {
    public static detachFiles<ThrowOnError extends boolean = false>(options: Options<DetachFilesData, ThrowOnError>) {
        return (options.client ?? client).delete<DetachFilesResponses, unknown, ThrowOnError>({ url: '/api/reports/v2/{reportId}/files', ...options });
    }
    
    public static attachFiles<ThrowOnError extends boolean = false>(options: Options<AttachFilesData, ThrowOnError>) {
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
    
    public static attachScreenshots<ThrowOnError extends boolean = false>(options: Options<AttachScreenshotsData, ThrowOnError>) {
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
    
    public static getReportFilesUrl<ThrowOnError extends boolean = false>(options: Options<GetReportFilesUrlData, ThrowOnError>) {
        return (options.client ?? client).get<GetReportFilesUrlResponses, unknown, ThrowOnError>({ url: '/api/reports/v2/{reportId}/files/url', ...options });
    }
    
    public static detailReport<ThrowOnError extends boolean = false>(options: Options<DetailReportData, ThrowOnError>) {
        return (options.client ?? client).get<DetailReportResponses, unknown, ThrowOnError>({ url: '/api/reports/v2/{reportId}', ...options });
    }
    
    public static updateReport<ThrowOnError extends boolean = false>(options: Options<UpdateReportData, ThrowOnError>) {
        return (options.client ?? client).patch<UpdateReportResponses, unknown, ThrowOnError>({
            url: '/api/reports/v2/{reportId}',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateReportRuleValidation<ThrowOnError extends boolean = false>(options: Options<UpdateReportRuleValidationData, ThrowOnError>) {
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
    public static ingestLolfiArchive<ThrowOnError extends boolean = false>(options: Options<IngestLolfiArchiveData, ThrowOnError>) {
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
    public static listJobs<ThrowOnError extends boolean = false>(options?: Options<ListJobsData, ThrowOnError>) {
        return (options?.client ?? client).get<ListJobsResponses, unknown, ThrowOnError>({ url: '/api/jobs/v1', ...options });
    }
    
    public static detailsJob<ThrowOnError extends boolean = false>(options: Options<DetailsJobData, ThrowOnError>) {
        return (options.client ?? client).get<DetailsJobResponses, unknown, ThrowOnError>({ url: '/api/jobs/v1/{jobId}', ...options });
    }
}

export class sessions {
    public static listSessionsOfTypeGardeDesSceaux<ThrowOnError extends boolean = false>(options?: Options<ListSessionsOfTypeGardeDesSceauxData, ThrowOnError>) {
        return (options?.client ?? client).get<ListSessionsOfTypeGardeDesSceauxResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/garde-des-sceaux', ...options });
    }
    
    public static countUsersNewSessions<ThrowOnError extends boolean = false>(options?: Options<CountUsersNewSessionsData, ThrowOnError>) {
        return (options?.client ?? client).get<CountUsersNewSessionsResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/new/count', ...options });
    }
    
    public static validateSession<ThrowOnError extends boolean = false>(options: Options<ValidateSessionData, ThrowOnError>) {
        return (options.client ?? client).post<ValidateSessionResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/validation', ...options });
    }
    
    public static createSessionFromLodam<ThrowOnError extends boolean = false>(options: Options<CreateSessionFromLodamData, ThrowOnError>) {
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
    
    public static updateSessionObservers<ThrowOnError extends boolean = false>(options: Options<UpdateSessionObserversData, ThrowOnError>) {
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
    
    public static affectReporters<ThrowOnError extends boolean = false>(options: Options<AffectReportersData, ThrowOnError>) {
        return (options.client ?? client).post<AffectReportersResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/reporters',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static listNominationFilesAsExcel<ThrowOnError extends boolean = false>(options: Options<ListNominationFilesAsExcelData, ThrowOnError>) {
        return (options.client ?? client).get<ListNominationFilesAsExcelResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files.xlsx', ...options });
    }
    
    public static listNominationFiles<ThrowOnError extends boolean = false>(options: Options<ListNominationFilesData, ThrowOnError>) {
        return (options.client ?? client).get<ListNominationFilesResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files', ...options });
    }
    
    public static detailNominationSessionAffectationsVersion<ThrowOnError extends boolean = false>(options: Options<DetailNominationSessionAffectationsVersionData, ThrowOnError>) {
        return (options.client ?? client).get<DetailNominationSessionAffectationsVersionResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/reporters/versions/last', ...options });
    }
    
    public static countUnaffectedNominationFiles<ThrowOnError extends boolean = false>(options: Options<CountUnaffectedNominationFilesData, ThrowOnError>) {
        return (options.client ?? client).get<CountUnaffectedNominationFilesResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/reporters/versions/last/unaffected-count', ...options });
    }
    
    public static countNominationFilesByStatus<ThrowOnError extends boolean = false>(options: Options<CountNominationFilesByStatusData, ThrowOnError>) {
        return (options.client ?? client).get<CountNominationFilesByStatusResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/status-counts', ...options });
    }
    
    public static listCurrentlyAffectedReporters<ThrowOnError extends boolean = false>(options: Options<ListCurrentlyAffectedReportersData, ThrowOnError>) {
        return (options.client ?? client).get<ListCurrentlyAffectedReportersResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/reporters/versions/last/members', ...options });
    }
    
    public static publishNominationSessionAffectationsVersion<ThrowOnError extends boolean = false>(options: Options<PublishNominationSessionAffectationsVersionData, ThrowOnError>) {
        return (options.client ?? client).post<PublishNominationSessionAffectationsVersionResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/reporters/versions', ...options });
    }
    
    public static autoAffectation<ThrowOnError extends boolean = false>(options: Options<AutoAffectationData, ThrowOnError>) {
        return (options.client ?? client).post<AutoAffectationResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/auto-affectation',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateNominationFileComment<ThrowOnError extends boolean = false>(options: Options<UpdateNominationFileCommentData, ThrowOnError>) {
        return (options.client ?? client).patch<UpdateNominationFileCommentResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/comment',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static defineNominationFileOutcome<ThrowOnError extends boolean = false>(options: Options<DefineNominationFileOutcomeData, ThrowOnError>) {
        return (options.client ?? client).put<DefineNominationFileOutcomeResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/outcome',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static hideNominationFileAlert<ThrowOnError extends boolean = false>(options: Options<HideNominationFileAlertData, ThrowOnError>) {
        return (options.client ?? client).delete<HideNominationFileAlertResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/file/{nominationFileId}/alert', ...options });
    }
    
    public static uploadSessionAttachments<ThrowOnError extends boolean = false>(options: Options<UploadSessionAttachmentsData, ThrowOnError>) {
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
    
    public static removeSessionAttachment<ThrowOnError extends boolean = false>(options: Options<RemoveSessionAttachmentData, ThrowOnError>) {
        return (options.client ?? client).delete<RemoveSessionAttachmentResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/attachments/{fileId}', ...options });
    }
    
    public static createNominationSessionAttachmentUrl<ThrowOnError extends boolean = false>(options: Options<CreateNominationSessionAttachmentUrlData, ThrowOnError>) {
        return (options.client ?? client).get<CreateNominationSessionAttachmentUrlResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/attachments/{fileId}', ...options });
    }
    
    public static listNominationSessionAttachments<ThrowOnError extends boolean = false>(options: Options<ListNominationSessionAttachmentsData, ThrowOnError>) {
        return (options.client ?? client).get<ListNominationSessionAttachmentsResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/attachments', ...options });
    }
    
    public static deleteNominationSession<ThrowOnError extends boolean = false>(options: Options<DeleteNominationSessionData, ThrowOnError>) {
        return (options.client ?? client).delete<DeleteNominationSessionResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}', ...options });
    }
    
    public static detailsNominationSession<ThrowOnError extends boolean = false>(options: Options<DetailsNominationSessionData, ThrowOnError>) {
        return (options.client ?? client).get<DetailsNominationSessionResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}', ...options });
    }
    
    public static updateNominationSession<ThrowOnError extends boolean = false>(options: Options<UpdateNominationSessionData, ThrowOnError>) {
        return (options.client ?? client).put<UpdateNominationSessionResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static getLolfiMagistratUrl<ThrowOnError extends boolean = false>(options: Options<GetLolfiMagistratUrlData, ThrowOnError>) {
        return (options.client ?? client).get<GetLolfiMagistratUrlResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/lolfi-url', ...options });
    }
}

export class summaries {
    public static detailSummary<ThrowOnError extends boolean = false>(options: Options<DetailSummaryData, ThrowOnError>) {
        return (options.client ?? client).get<DetailSummaryResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary', ...options });
    }
    
    public static createSummary<ThrowOnError extends boolean = false>(options: Options<CreateSummaryData, ThrowOnError>) {
        return (options.client ?? client).post<CreateSummaryResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary', ...options });
    }
    
    public static detachSummaryFiles<ThrowOnError extends boolean = false>(options: Options<DetachSummaryFilesData, ThrowOnError>) {
        return (options.client ?? client).delete<DetachSummaryFilesResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/attachments', ...options });
    }
    
    public static attachSummaryFiles<ThrowOnError extends boolean = false>(options: Options<AttachSummaryFilesData, ThrowOnError>) {
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
    
    public static includeFilesInContent<ThrowOnError extends boolean = false>(options: Options<IncludeFilesInContentData, ThrowOnError>) {
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
    
    public static writeSummary<ThrowOnError extends boolean = false>(options: Options<WriteSummaryData, ThrowOnError>) {
        return (options.client ?? client).put<WriteSummaryResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/content',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static searchSummaryReaders<ThrowOnError extends boolean = false>(options: Options<SearchSummaryReadersData, ThrowOnError>) {
        return (options.client ?? client).get<SearchSummaryReadersResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/readers', ...options });
    }
    
    public static updateSummaryReadersList<ThrowOnError extends boolean = false>(options: Options<UpdateSummaryReadersListData, ThrowOnError>) {
        return (options.client ?? client).put<UpdateSummaryReadersListResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/readers',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static generateAttachmentPublicUrl<ThrowOnError extends boolean = false>(options: Options<GenerateAttachmentPublicUrlData, ThrowOnError>) {
        return (options.client ?? client).get<GenerateAttachmentPublicUrlResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/attachments/{fileId}/url', ...options });
    }
}

export class members {
    public static listMembers<ThrowOnError extends boolean = false>(options: Options<ListMembersData, ThrowOnError>) {
        return (options.client ?? client).get<ListMembersResponses, unknown, ThrowOnError>({ url: '/api/members/v1', ...options });
    }
    
    public static detailsMember<ThrowOnError extends boolean = false>(options: Options<DetailsMemberData, ThrowOnError>) {
        return (options.client ?? client).get<DetailsMemberResponses, unknown, ThrowOnError>({ url: '/api/members/v1/{userId}', ...options });
    }
    
    public static excludeJurisdictions<ThrowOnError extends boolean = false>(options: Options<ExcludeJurisdictionsData, ThrowOnError>) {
        return (options.client ?? client).put<ExcludeJurisdictionsResponses, unknown, ThrowOnError>({
            url: '/api/members/v1/{userId}/excluded-jurisdictions',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateDisplayTitle<ThrowOnError extends boolean = false>(options: Options<UpdateDisplayTitleData, ThrowOnError>) {
        return (options.client ?? client).put<UpdateDisplayTitleResponses, unknown, ThrowOnError>({
            url: '/api/members/v1/{userId}/display-title',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateTitle<ThrowOnError extends boolean = false>(options: Options<UpdateTitleData, ThrowOnError>) {
        return (options.client ?? client).put<UpdateTitleResponses, unknown, ThrowOnError>({
            url: '/api/members/v1/{userId}/title',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static listMemberSessions<ThrowOnError extends boolean = false>(options: Options<ListMemberSessionsData, ThrowOnError>) {
        return (options.client ?? client).get<ListMemberSessionsResponses, unknown, ThrowOnError>({ url: '/api/members/v1/{userId}/sessions/transparence/garde-des-sceaux', ...options });
    }
    
    public static detailsMemberSession<ThrowOnError extends boolean = false>(options: Options<DetailsMemberSessionData, ThrowOnError>) {
        return (options.client ?? client).get<DetailsMemberSessionResponses, unknown, ThrowOnError>({ url: '/api/members/v1/{userId}/sessions/transparence/garde-des-sceaux/{sessionId}', ...options });
    }
    
    public static writeNominationFileMemberMemo<ThrowOnError extends boolean = false>(options: Options<WriteNominationFileMemberMemoData, ThrowOnError>) {
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
    public static search<ThrowOnError extends boolean = false>(options?: Options<SearchData, ThrowOnError>) {
        return (options?.client ?? client).get<SearchResponses, unknown, ThrowOnError>({ url: '/api/jurisdictions/v1', ...options });
    }
}

export class docs {
    /**
     * prefer find members and use the title
     */
    public static searchChairmen<ThrowOnError extends boolean = false>(options?: Options<SearchChairmenData, ThrowOnError>) {
        return (options?.client ?? client).get<SearchChairmenResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/chairmen', ...options });
    }
    
    public static listSecretariesGeneral<ThrowOnError extends boolean = false>(options?: Options<ListSecretariesGeneralData, ThrowOnError>) {
        return (options?.client ?? client).get<ListSecretariesGeneralResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/secretaries-general', ...options });
    }
    
    public static createAgenda<ThrowOnError extends boolean = false>(options: Options<CreateAgendaData, ThrowOnError>) {
        return (options.client ?? client).post<CreateAgendaResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/sessions/{sessionId}/agendas',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static deleteAgenda<ThrowOnError extends boolean = false>(options: Options<DeleteAgendaData, ThrowOnError>) {
        return (options.client ?? client).delete<DeleteAgendaResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/agendas/{agendaId}', ...options });
    }
    
    public static detailsAgendaMetadata<ThrowOnError extends boolean = false>(options: Options<DetailsAgendaMetadataData, ThrowOnError>) {
        return (options.client ?? client).get<DetailsAgendaMetadataResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/agendas/{agendaId}', ...options });
    }
    
    public static updateAgenda<ThrowOnError extends boolean = false>(options: Options<UpdateAgendaData, ThrowOnError>) {
        return (options.client ?? client).put<UpdateAgendaResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/agendas/{agendaId}',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static findAgendaNominationFiles<ThrowOnError extends boolean = false>(options: Options<FindAgendaNominationFilesData, ThrowOnError>) {
        return (options.client ?? client).get<FindAgendaNominationFilesResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/sessions/{sessionId}/files', ...options });
    }
    
    public static findSessionDocs<ThrowOnError extends boolean = false>(options: Options<FindSessionDocsData, ThrowOnError>) {
        return (options.client ?? client).get<FindSessionDocsResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/sessions/{sessionId}/docs', ...options });
    }
    
    public static detailsSessionAgenda<ThrowOnError extends boolean = false>(options: Options<DetailsSessionAgendaData, ThrowOnError>) {
        return (options.client ?? client).get<DetailsSessionAgendaResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/sessions/{sessionId}/agendas/{agendaId}', ...options });
    }
    
    public static detailsSessionOfficialReport<ThrowOnError extends boolean = false>(options: Options<DetailsSessionOfficialReportData, ThrowOnError>) {
        return (options.client ?? client).get<DetailsSessionOfficialReportResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/sessions/{sessionId}/official-reports/{officialReportId}', ...options });
    }
    
    /**
     * @deprecated
     */
    public static detailsSessionDoc<ThrowOnError extends boolean = false>(options: Options<DetailsSessionDocData, ThrowOnError>) {
        return (options.client ?? client).get<DetailsSessionDocResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/sessions/{sessionId}/docs/{agendaId}', ...options });
    }
    
    public static isSessionReadyForDocGeneration<ThrowOnError extends boolean = false>(options: Options<IsSessionReadyForDocGenerationData, ThrowOnError>) {
        return (options.client ?? client).get<IsSessionReadyForDocGenerationResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/sessions/{sessionId}/readiness', ...options });
    }
    
    public static generateAgendaHtml<ThrowOnError extends boolean = false>(options: Options<GenerateAgendaHtmlData, ThrowOnError>) {
        return (options.client ?? client).get<GenerateAgendaHtmlResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/agendas/{agendaId}.html', ...options });
    }
    
    public static generateAgendaPdf<ThrowOnError extends boolean = false>(options: Options<GenerateAgendaPdfData, ThrowOnError>) {
        return (options.client ?? client).get<GenerateAgendaPdfResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/agendas/{agendaId}.pdf', ...options });
    }
    
    public static detailsAgendaFiles<ThrowOnError extends boolean = false>(options: Options<DetailsAgendaFilesData, ThrowOnError>) {
        return (options.client ?? client).get<DetailsAgendaFilesResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/agendas/{agendaId}/files', ...options });
    }
    
    public static updateAgendaHtml<ThrowOnError extends boolean = false>(options: Options<UpdateAgendaHtmlData, ThrowOnError>) {
        return (options.client ?? client).patch<UpdateAgendaHtmlResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/docs/v1/agendas/{agendaId}/html',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
    
    public static resetAgendaDocument<ThrowOnError extends boolean = false>(options: Options<ResetAgendaDocumentData, ThrowOnError>) {
        return (options.client ?? client).delete<ResetAgendaDocumentResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/agendas/{agendaId}/document', ...options });
    }
    
    public static createOfficialReport<ThrowOnError extends boolean = false>(options: Options<CreateOfficialReportData, ThrowOnError>) {
        return (options.client ?? client).post<CreateOfficialReportResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/sessions/{sessionId}/official-reports',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    /**
     * prefer generic query searchJusticeContact
     *
     * @deprecated
     */
    public static searchOfficialReportJusticeContact<ThrowOnError extends boolean = false>(options?: Options<SearchOfficialReportJusticeContactData, ThrowOnError>) {
        return (options?.client ?? client).get<SearchOfficialReportJusticeContactResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/justice-contacts', ...options });
    }
    
    /**
     * prefer generic query createJusticeContact
     *
     * @deprecated
     */
    public static createOfficialReportJusticeContact<ThrowOnError extends boolean = false>(options: Options<CreateOfficialReportJusticeContactData, ThrowOnError>) {
        return (options.client ?? client).post<CreateOfficialReportJusticeContactResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/official-reports/justice-contacts',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static searchJusticeContact<ThrowOnError extends boolean = false>(options?: Options<SearchJusticeContactData, ThrowOnError>) {
        return (options?.client ?? client).get<SearchJusticeContactResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/justice-contacts', ...options });
    }
    
    public static createJusticeContact<ThrowOnError extends boolean = false>(options: Options<CreateJusticeContactData, ThrowOnError>) {
        return (options.client ?? client).post<CreateJusticeContactResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/justice-contacts',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static listAgendasForNewOfficialReport<ThrowOnError extends boolean = false>(options: Options<ListAgendasForNewOfficialReportData, ThrowOnError>) {
        return (options.client ?? client).get<ListAgendasForNewOfficialReportResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/sessions/{sessionId}/new-official-reports/agendas', ...options });
    }
    
    /**
     * prefer find members by formation
     *
     * @deprecated
     */
    public static listMembersForNewOfficialReport<ThrowOnError extends boolean = false>(options: Options<ListMembersForNewOfficialReportData, ThrowOnError>) {
        return (options.client ?? client).get<ListMembersForNewOfficialReportResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/sessions/{sessionId}/new-official-reports/members', ...options });
    }
    
    public static generateOfficialReportHtml<ThrowOnError extends boolean = false>(options: Options<GenerateOfficialReportHtmlData, ThrowOnError>) {
        return (options.client ?? client).get<GenerateOfficialReportHtmlResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}.html', ...options });
    }
    
    public static generateOfficialReportPdf<ThrowOnError extends boolean = false>(options: Options<GenerateOfficialReportPdfData, ThrowOnError>) {
        return (options.client ?? client).get<GenerateOfficialReportPdfResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}.pdf', ...options });
    }
    
    public static deleteOfficialReport<ThrowOnError extends boolean = false>(options: Options<DeleteOfficialReportData, ThrowOnError>) {
        return (options.client ?? client).delete<DeleteOfficialReportResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}', ...options });
    }
    
    public static detailsOfficialReport<ThrowOnError extends boolean = false>(options: Options<DetailsOfficialReportData, ThrowOnError>) {
        return (options.client ?? client).get<DetailsOfficialReportResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}', ...options });
    }
    
    public static updateOfficialReport<ThrowOnError extends boolean = false>(options: Options<UpdateOfficialReportData, ThrowOnError>) {
        return (options.client ?? client).put<UpdateOfficialReportResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/official-reports/{officialReportId}',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateOfficialReportHtml<ThrowOnError extends boolean = false>(options: Options<UpdateOfficialReportHtmlData, ThrowOnError>) {
        return (options.client ?? client).patch<UpdateOfficialReportHtmlResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/docs/v1/official-reports/{officialReportId}/html',
            ...options,
            headers: {
                'Content-Type': null,
                ...options.headers
            }
        });
    }
    
    public static resetOfficialReportDocument<ThrowOnError extends boolean = false>(options: Options<ResetOfficialReportDocumentData, ThrowOnError>) {
        return (options.client ?? client).delete<ResetOfficialReportDocumentResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/official-reports/{officialReportId}/document', ...options });
    }
    
    public static listPresentationPlanAgendas<ThrowOnError extends boolean = false>(options?: Options<ListPresentationPlanAgendasData, ThrowOnError>) {
        return (options?.client ?? client).get<ListPresentationPlanAgendasResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/agendas', ...options });
    }
    
    public static generatePresentationPlanHtml<ThrowOnError extends boolean = false>(options: Options<GeneratePresentationPlanHtmlData, ThrowOnError>) {
        return (options.client ?? client).get<GeneratePresentationPlanHtmlResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/{planId}.html', ...options });
    }
    
    public static generatePresentationPlanPdf<ThrowOnError extends boolean = false>(options: Options<GeneratePresentationPlanPdfData, ThrowOnError>) {
        return (options.client ?? client).get<GeneratePresentationPlanPdfResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/{planId}.pdf', ...options });
    }
    
    public static listPresentedPlans<ThrowOnError extends boolean = false>(options?: Options<ListPresentedPlansData, ThrowOnError>) {
        return (options?.client ?? client).get<ListPresentedPlansResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/presented', ...options });
    }
    
    public static deleteJusticePresentationPlan<ThrowOnError extends boolean = false>(options: Options<DeleteJusticePresentationPlanData, ThrowOnError>) {
        return (options.client ?? client).delete<DeleteJusticePresentationPlanResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/{planId}', ...options });
    }
    
    public static detailsPresentationPlanMetadata<ThrowOnError extends boolean = false>(options: Options<DetailsPresentationPlanMetadataData, ThrowOnError>) {
        return (options.client ?? client).get<DetailsPresentationPlanMetadataResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/{planId}', ...options });
    }
    
    public static updateJusticePresentationPlan<ThrowOnError extends boolean = false>(options: Options<UpdateJusticePresentationPlanData, ThrowOnError>) {
        return (options.client ?? client).put<UpdateJusticePresentationPlanResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/presentation-plans/{planId}',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static listNonPresentedPlans<ThrowOnError extends boolean = false>(options?: Options<ListNonPresentedPlansData, ThrowOnError>) {
        return (options?.client ?? client).get<ListNonPresentedPlansResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans', ...options });
    }
    
    public static createJusticePresentationPlan<ThrowOnError extends boolean = false>(options: Options<CreateJusticePresentationPlanData, ThrowOnError>) {
        return (options.client ?? client).post<CreateJusticePresentationPlanResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/presentation-plans',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static detailsJusticePresentationPlanPdfDocument<ThrowOnError extends boolean = false>(options: Options<DetailsJusticePresentationPlanPdfDocumentData, ThrowOnError>) {
        return (options.client ?? client).get<DetailsJusticePresentationPlanPdfDocumentResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/{planId}/url', ...options });
    }
    
    public static updatePresentationPlanHtml<ThrowOnError extends boolean = false>(options: Options<UpdatePresentationPlanHtmlData, ThrowOnError>) {
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
    
    public static resetPresentationPlanDocument<ThrowOnError extends boolean = false>(options: Options<ResetPresentationPlanDocumentData, ThrowOnError>) {
        return (options.client ?? client).delete<ResetPresentationPlanDocumentResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/{planId}/document', ...options });
    }
    
    public static unPresentPlan<ThrowOnError extends boolean = false>(options: Options<UnPresentPlanData, ThrowOnError>) {
        return (options.client ?? client).delete<UnPresentPlanResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/presentation-plans/{planId}/presentation', ...options });
    }
    
    public static presentPlan<ThrowOnError extends boolean = false>(options: Options<PresentPlanData, ThrowOnError>) {
        return (options.client ?? client).put<PresentPlanResponses, unknown, ThrowOnError>({
            url: '/api/docs/v1/presentation-plans/{planId}/presentation',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static findDocsMembers<ThrowOnError extends boolean = false>(options: Options<FindDocsMembersData, ThrowOnError>) {
        return (options.client ?? client).get<FindDocsMembersResponses, unknown, ThrowOnError>({ url: '/api/docs/v1/members', ...options });
    }
}

export class magistrats {
    public static searchMagistrats<ThrowOnError extends boolean = false>(options?: Options<SearchMagistratsData, ThrowOnError>) {
        return (options?.client ?? client).get<SearchMagistratsResponses, unknown, ThrowOnError>({ url: '/api/magistrats/v1', ...options });
    }
    
    public static searchFullName<ThrowOnError extends boolean = false>(options: Options<SearchFullNameData, ThrowOnError>) {
        return (options.client ?? client).get<SearchFullNameResponses, unknown, ThrowOnError>({ url: '/api/magistrats/v1/fullname', ...options });
    }
}

export class observations {
    public static listObservations<ThrowOnError extends boolean = false>(options: Options<ListObservationsData, ThrowOnError>) {
        return (options.client ?? client).get<ListObservationsResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations', ...options });
    }
    
    public static createObservation<ThrowOnError extends boolean = false>(options: Options<CreateObservationData, ThrowOnError>) {
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
    
    public static deleteObservation<ThrowOnError extends boolean = false>(options: Options<DeleteObservationData, ThrowOnError>) {
        return (options.client ?? client).delete<DeleteObservationResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}', ...options });
    }
    
    public static getObservationDetails<ThrowOnError extends boolean = false>(options: Options<GetObservationDetailsData, ThrowOnError>) {
        return (options.client ?? client).get<GetObservationDetailsResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}', ...options });
    }
    
    public static updateObservation<ThrowOnError extends boolean = false>(options: Options<UpdateObservationData, ThrowOnError>) {
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
    
    public static getObservationFileUrl<ThrowOnError extends boolean = false>(options: Options<GetObservationFileUrlData, ThrowOnError>) {
        return (options.client ?? client).get<GetObservationFileUrlResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}/files/{fileId}/url', ...options });
    }
    
    public static attachMemberCommentScreenshots<ThrowOnError extends boolean = false>(options: Options<AttachMemberCommentScreenshotsData, ThrowOnError>) {
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
    
    public static writeMemberComment<ThrowOnError extends boolean = false>(options: Options<WriteMemberCommentData, ThrowOnError>) {
        return (options.client ?? client).put<WriteMemberCommentResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}/member-comments',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static followUpOnObservation<ThrowOnError extends boolean = false>(options: Options<FollowUpOnObservationData, ThrowOnError>) {
        return (options.client ?? client).put<FollowUpOnObservationResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}/follow-up',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static listObservationsAttachments<ThrowOnError extends boolean = false>(options: Options<ListObservationsAttachmentsData, ThrowOnError>) {
        return (options.client ?? client).get<ListObservationsAttachmentsResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/observations/attachments', ...options });
    }
}

export class administration {
    public static listUsers<ThrowOnError extends boolean = false>(options?: Options<ListUsersData, ThrowOnError>) {
        return (options?.client ?? client).get<ListUsersResponses, unknown, ThrowOnError>({ url: '/api/administration/v1/users', ...options });
    }
    
    public static detailsUser<ThrowOnError extends boolean = false>(options: Options<DetailsUserData, ThrowOnError>) {
        return (options.client ?? client).get<DetailsUserResponses, unknown, ThrowOnError>({ url: '/api/administration/v1/users/{userId}', ...options });
    }
    
    public static updateEmail<ThrowOnError extends boolean = false>(options: Options<UpdateEmailData, ThrowOnError>) {
        return (options.client ?? client).put<UpdateEmailResponses, unknown, ThrowOnError>({
            url: '/api/administration/v1/users/{userId}/email',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updatePassword<ThrowOnError extends boolean = false>(options: Options<UpdatePasswordData, ThrowOnError>) {
        return (options.client ?? client).put<UpdatePasswordResponses, unknown, ThrowOnError>({
            url: '/api/administration/v1/users/{userId}/password',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateRole<ThrowOnError extends boolean = false>(options: Options<UpdateRoleData, ThrowOnError>) {
        return (options.client ?? client).put<UpdateRoleResponses, unknown, ThrowOnError>({
            url: '/api/administration/v1/users/{userId}/role',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static updateDisplayTitle<ThrowOnError extends boolean = false>(options: Options<UpdateDisplayTitle2Data, ThrowOnError>) {
        return (options.client ?? client).put<UpdateDisplayTitle2Responses, unknown, ThrowOnError>({
            url: '/api/administration/v1/users/{userId}/display-title',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static demoteFromAdmin<ThrowOnError extends boolean = false>(options: Options<DemoteFromAdminData, ThrowOnError>) {
        return (options.client ?? client).delete<DemoteFromAdminResponses, unknown, ThrowOnError>({ url: '/api/administration/v1/users/{userId}/promotion', ...options });
    }
    
    public static promoteToAdmin<ThrowOnError extends boolean = false>(options: Options<PromoteToAdminData, ThrowOnError>) {
        return (options.client ?? client).put<PromoteToAdminResponses, unknown, ThrowOnError>({ url: '/api/administration/v1/users/{userId}/promotion', ...options });
    }
}
