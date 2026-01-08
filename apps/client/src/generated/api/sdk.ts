/* eslint-disable */
// this file is auto-generated
//
// Licensed under the Apache License, Version 2.0
//

import { client } from './client.ts';
import { type Client, formDataBodySerializer, type Options as Options2, type TDataShape } from './client/index.ts';
import type { AffectReportersData, AffectReportersResponses, AttachFilesData, AttachFilesResponses, AutoAffectationData, AutoAffectationResponses, CreateNominationSessionAttachmentUrlData, CreateNominationSessionAttachmentUrlResponses, CreateSessionFromLodamData, CreateSessionFromLodamResponses, DefineNominationFileOutcomeData, DefineNominationFileOutcomeResponses, DetachFilesData, DetachFilesResponses, DetailNominationSessionAffectationsVersionData, DetailNominationSessionAffectationsVersionResponses, DetailReportData, DetailReportResponses, DetailsMemberData, DetailsMemberResponses, DetailsMemberSessionData, DetailsMemberSessionResponses, DetailsNominationSessionData, DetailsNominationSessionResponses, ExcludeJurisdictionsData, ExcludeJurisdictionsResponses, GetCommentAccessData, GetCommentAccessResponses, GetFileByFileUrlData, GetFileByFileUrlResponses, GetReportFilesUrlData, GetReportFilesUrlResponses, IntrospectSessionData, IntrospectSessionResponses, ListMembersData, ListMemberSessionsData, ListMemberSessionsResponses, ListMembersResponses, ListNominationFilesData, ListNominationFilesResponses, ListNominationSessionAttachmentsData, ListNominationSessionAttachmentsResponses, ListSessionsOfTypeGardeDesSceauxData, ListSessionsOfTypeGardeDesSceauxResponses, LoginData, LoginResponses, LogoutData, LogoutResponses, PublishNominationSessionAffectationsVersionData, PublishNominationSessionAffectationsVersionResponses, RemoveSessionAttachmentData, RemoveSessionAttachmentResponses, SearchData, SearchResponses, UpdateCommentAccessData, UpdateCommentAccessResponses, UpdateNominationFileCommentData, UpdateNominationFileCommentResponses, UpdateNominationSessionData, UpdateNominationSessionResponses, UpdateReportData, UpdateReportResponses, UpdateReportRuleValidationData, UpdateReportRuleValidationResponses, UpdateSessionObserversData, UpdateSessionObserversResponses, UploadSessionAttachmentData, UploadSessionAttachmentResponses } from './types.ts';

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
    public static login<ThrowOnError extends boolean = false>(options: Options<LoginData, ThrowOnError>) {
        return (options.client ?? client).post<LoginResponses, unknown, ThrowOnError>({
            url: '/api/auth/v2/login',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }
    
    public static introspectSession<ThrowOnError extends boolean = false>(options?: Options<IntrospectSessionData, ThrowOnError>) {
        return (options?.client ?? client).get<IntrospectSessionResponses, unknown, ThrowOnError>({ url: '/api/auth/v2/introspect', ...options });
    }
    
    public static logout<ThrowOnError extends boolean = false>(options?: Options<LogoutData, ThrowOnError>) {
        return (options?.client ?? client).post<LogoutResponses, unknown, ThrowOnError>({ url: '/api/auth/v2/logout', ...options });
    }
}

export class sessions {
    public static listSessionsOfTypeGardeDesSceaux<ThrowOnError extends boolean = false>(options?: Options<ListSessionsOfTypeGardeDesSceauxData, ThrowOnError>) {
        return (options?.client ?? client).get<ListSessionsOfTypeGardeDesSceauxResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/garde-des-sceaux', ...options });
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
    
    public static listNominationFiles<ThrowOnError extends boolean = false>(options: Options<ListNominationFilesData, ThrowOnError>) {
        return (options.client ?? client).get<ListNominationFilesResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files', ...options });
    }
    
    public static detailNominationSessionAffectationsVersion<ThrowOnError extends boolean = false>(options: Options<DetailNominationSessionAffectationsVersionData, ThrowOnError>) {
        return (options.client ?? client).get<DetailNominationSessionAffectationsVersionResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/reporters/versions/last', ...options });
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
    
    public static getCommentAccess<ThrowOnError extends boolean = false>(options: Options<GetCommentAccessData, ThrowOnError>) {
        return (options.client ?? client).get<GetCommentAccessResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/comment-access', ...options });
    }
    
    public static updateCommentAccess<ThrowOnError extends boolean = false>(options: Options<UpdateCommentAccessData, ThrowOnError>) {
        return (options.client ?? client).put<UpdateCommentAccessResponses, unknown, ThrowOnError>({
            url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/comment-access',
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
    
    public static listNominationSessionAttachments<ThrowOnError extends boolean = false>(options: Options<ListNominationSessionAttachmentsData, ThrowOnError>) {
        return (options.client ?? client).get<ListNominationSessionAttachmentsResponses, unknown, ThrowOnError>({ url: '/api/sessions/v2/{sessionId}/attachments', ...options });
    }
    
    public static uploadSessionAttachment<ThrowOnError extends boolean = false>(options: Options<UploadSessionAttachmentData, ThrowOnError>) {
        return (options.client ?? client).put<UploadSessionAttachmentResponses, unknown, ThrowOnError>({
            ...formDataBodySerializer,
            url: '/api/sessions/v2/{sessionId}/attachments',
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
}

export class members {
    public static listMembers<ThrowOnError extends boolean = false>(options?: Options<ListMembersData, ThrowOnError>) {
        return (options?.client ?? client).get<ListMembersResponses, unknown, ThrowOnError>({ url: '/api/members/v1', ...options });
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
    
    public static listMemberSessions<ThrowOnError extends boolean = false>(options: Options<ListMemberSessionsData, ThrowOnError>) {
        return (options.client ?? client).get<ListMemberSessionsResponses, unknown, ThrowOnError>({ url: '/api/members/v1/{userId}/sessions/transparence/garde-des-sceaux', ...options });
    }
    
    public static detailsMemberSession<ThrowOnError extends boolean = false>(options: Options<DetailsMemberSessionData, ThrowOnError>) {
        return (options.client ?? client).get<DetailsMemberSessionResponses, unknown, ThrowOnError>({ url: '/api/members/v1/{userId}/sessions/transparence/garde-des-sceaux/{sessionId}', ...options });
    }
}

export class jurisdictions {
    public static search<ThrowOnError extends boolean = false>(options?: Options<SearchData, ThrowOnError>) {
        return (options?.client ?? client).get<SearchResponses, unknown, ThrowOnError>({ url: '/api/jurisdictions/v1', ...options });
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
