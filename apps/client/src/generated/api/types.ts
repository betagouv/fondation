/* eslint-disable */
// this file is auto-generated
//
// Licensed under the Apache License, Version 2.0
//

export type ClientOptions = {
    baseUrl: string;
};

export type LoginDto = {
    email: string;
    password: string;
};

export type DetailedUserResponseDto = {
    userId: string;
    firstName: string;
    lastName: string;
    role: 'MEMBRE_DU_SIEGE' | 'MEMBRE_DU_PARQUET' | 'MEMBRE_COMMUN' | 'ADJOINT_SECRETAIRE_GENERAL';
    gender: 'MALE' | 'FEMALE';
};

export type ListedNominationSessionsDto = {
    items: Array<{
        id: string;
        name: string;
        formation: 'PARQUET' | 'SIEGE';
        date: {
            year: number;
            month: number;
            day: number;
        };
        dueDate: {
            year: number;
            month: number;
            day: number;
        } | null;
        typeDeSaisine: 'TRANSPARENCE_GDS';
    }>;
};

export type ImportNominationSessionFromLodamXlsxDto = {
    file: Blob | File;
    form: {
        name: string;
        formation: 'PARQUET' | 'SIEGE';
        date: string;
        observationClosingDate: string;
        dueDate?: string | null;
        positionStartDate?: string | null;
    };
};

export type CreatedNominationSessionDto = {
    id: string;
};

export type UpdateNominationSessionFilesObserversDto = {
    file: Blob | File;
};

export type AffectReportersDto = {
    items: Array<{
        nominationFileId: string;
        priority: 'ETOILE' | 'OUTRE_MER' | 'PROFILE';
        reporterIds: Array<string>;
    }>;
};

export type PaginatedNominationFiles = {
    items: Array<{
        id: string;
        priority: 'ETOILE' | 'OUTRE_MER' | 'PROFILE';
        content: {
            /**
             * always 2
             */
            version: number;
            nomMagistrat: string;
            numeroDeDossier: number | null;
            dateEchéance: {
                year: number;
                month: number;
                day: number;
            } | null;
            grade: 'I' | 'II' | 'III' | 'HH' | 'G1' | 'G2' | 'G3' | 'G3sup';
            posteActuel: string | null;
            posteCible: string | null;
            gradeCible: 'I' | 'II' | 'III' | 'HH' | 'G1' | 'G2' | 'G3' | 'G3sup';
            rang: string | null;
            dateDeNaissance: {
                year: number;
                month: number;
                day: number;
            } | null;
            historique: string | null;
            observants: Array<string> | null;
            datePassageAuGrade: {
                year: number;
                month: number;
                day: number;
            } | null;
            datePriseDeFonctionPosteActuel: {
                year: number;
                month: number;
                day: number;
            } | null;
            informationCarrière: string | null;
            outcome: {
                value: 'VALIDATED' | 'NON_VALIDATED' | 'SUSPENDED' | 'REMOVED' | 'WITHDRAWN';
                comment: string | null;
            } | null;
        };
        comment: string | null;
        commentAccessUserIds?: Array<string>;
        reporters: Array<{
            id: string;
            firstName: string;
            lastName: string;
        }>;
        observationCount: number;
        observationMagistrats: Array<{
            id: string;
            firstName: string;
            lastName: string;
            observationId: string;
        }>;
        memo: string | null;
        summary: {
            id: string;
            canRead: boolean;
            canWrite: boolean;
        } | null;
    }>;
    totalCount: number;
    currentPageIndex: number;
    nextPageIndex?: number;
    previousPageIndex?: number;
    links?: {
        next?: string;
        previous?: string;
    };
};

export type FoundAffectationVersion = {
    id: string;
    status: 'BROUILLON' | 'PUBLIEE';
    version: number;
    publicationDate: string | null;
    author: {
        id: string;
        firstName: string;
        lastName: string;
    } | null;
};

export type CountedUnaffectedFilesDto = {
    count: number;
};

export type ListedCurrentlyAffectedReportersDto = {
    items: Array<{
        id: string;
        firstName: string;
        lastName: string;
    }>;
};

export type AutoAffectationDto = {
    nominationFileIds?: Array<string>;
};

export type UpdateCommentDto = {
    comment: string | null;
};

export type ListCommentAccessDto = {
    comment: string | null;
    userIds: Array<string>;
};

export type UpdateCommentAccessDto = {
    userIds: Array<string>;
};

export type DefineNominationFileOutcomeDto = {
    outcome: 'VALIDATED' | 'NON_VALIDATED' | 'SUSPENDED' | 'REMOVED' | 'WITHDRAWN';
    comment: string | null;
};

export type UploadSessionAttachmentDto = {
    file: Blob | File;
};

export type ListedNominationSessionAttachmentDto = {
    items: Array<{
        name: string;
        id: string;
    }>;
};

export type DetailedNominationSessionAttachmentDto = {
    id: string;
    name: string;
    url: string;
};

export type DetailedNominationSessionDto = {
    id: string;
    name: string;
    formation: 'PARQUET' | 'SIEGE';
    date: {
        year: number;
        month: number;
        day: number;
    };
    observationsClosingDate: {
        year: number;
        month: number;
        day: number;
    };
    dueDate: {
        year: number;
        month: number;
        day: number;
    } | null;
    positionStartDate: {
        year: number;
        month: number;
        day: number;
    } | null;
    typeDeSaisine: 'TRANSPARENCE_GDS';
};

export type UpdateNominationSessionDto = {
    name: string;
    date: string;
    observationsClosingDate: string;
    dueDate: string | null;
    positionStartDate: string | null;
};

export type LolfiMagistratUrlDto = {
    url: string;
};

export type PaginatedMemberListItemDto = {
    items: Array<{
        id: string;
        firstName: string;
        lastName: string;
        role: 'MEMBRE_COMMUN' | 'MEMBRE_DU_PARQUET' | 'MEMBRE_DU_SIEGE';
        stats: Array<{
            year: number;
            count: number;
            targetedGrade: 'I' | 'II' | 'III' | 'HH' | 'G1' | 'G2' | 'G3' | 'G3sup';
        }>;
    }>;
    totalCount: number;
    currentPageIndex: number;
    nextPageIndex?: number;
    previousPageIndex?: number;
    links?: {
        next?: string;
        previous?: string;
    };
};

export type DetailedMemberDto = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'MEMBRE_COMMUN' | 'MEMBRE_DU_PARQUET' | 'MEMBRE_DU_SIEGE';
    gender: string;
    excludedJurisdictions: Array<{
        id: string;
        label: string | null;
    }>;
    stats: Array<{
        count: number;
        year: number;
        targetedGrade: 'I' | 'II' | 'III' | 'HH' | 'G1' | 'G2' | 'G3' | 'G3sup';
    }>;
};

export type ExcludeJurisdictionsDto = {
    jurisdictionIds: Array<string>;
};

export type ListedMemberSessionsDto = {
    items: Array<{
        id: string;
        label: string;
        createdAt: string;
        isAffected: boolean;
        fileCount: number;
        formation: 'PARQUET' | 'SIEGE';
        typeDeSaisine: 'TRANSPARENCE_GDS';
    }>;
};

export type DetailedMemberSessionDto = {
    data: {
        session: {
            id: string;
            sessionImportId: string;
            formation: string;
            transparency: string;
            dateTransparence: {
                year: number;
                month: number;
                day: number;
            };
            dateSeance: {
                year: number;
                month: number;
                day: number;
            } | null;
        };
        reports: Array<{
            id: string;
            nominationFileId: string;
            state: string;
            formation: string;
            folderNumber: number | null;
            filePriority: 'ETOILE' | 'OUTRE_MER' | 'PROFILE';
            dueDate: {
                year: number;
                month: number;
                day: number;
            } | null;
            name: string;
            grade: string;
            targettedPosition: string;
            observers: Array<string>;
            observationMagistrats: Array<{
                id: string;
                firstName: string;
                lastName: string;
                observationId: string;
            }>;
        }>;
    };
};

export type WriteNominationFileMemberMemoDto = {
    memo: string;
};

export type ListedJurisdictions = {
    items: Array<{
        id: string;
        label: string | null;
        type: string;
        ville: string | null;
    }>;
};

export type CreatedSummaryDto = {
    id: string;
};

export type AttachSummaryFilesDto = {
    files: Array<Blob | File>;
};

export type IncludeFilesInSummaryContentDto = {
    files: Array<Blob | File>;
};

export type IncludedFilesInSummaryContentDto = {
    items: Array<{
        id: string;
        name: string;
        url: string;
        type: string;
    }>;
};

export type WriteSummaryContentDto = {
    content: string;
};

export type UpdateSummaryReadersListDto = {
    readerIds: Array<string>;
};

export type GeneratedSummaryAttachmentPublicUrlDto = {
    id: string;
    name: string;
    type: string;
    url: string;
};

export type DetailedSummaryDto = {
    id: string;
    sessionId: string;
    name: string | null;
    rank: string | null;
    formation: 'PARQUET' | 'SIEGE';
    number: number | null;
    birthDate: {
        year: number;
        month: number;
        day: number;
    } | null;
    grade: 'I' | 'II' | 'III' | 'HH' | 'G1' | 'G2' | 'G3' | 'G3sup';
    position: string | null;
    targetedGrade: 'I' | 'II' | 'III' | 'HH' | 'G1' | 'G2' | 'G3' | 'G3sup';
    targetedPosition: string | null;
    priority: 'ETOILE' | 'OUTRE_MER' | 'PROFILE';
    biography: string;
    lastRankingDate: {
        year: number;
        month: number;
        day: number;
    } | null;
    lastPositionDate: {
        year: number;
        month: number;
        day: number;
    } | null;
    observers: Array<string>;
    observations: Array<{
        id: string;
        magistrat: {
            id: string;
            firstName: string;
            usedName: string;
            lastName: string;
        };
    }>;
    outcome: {
        value: 'VALIDATED' | 'NON_VALIDATED' | 'SUSPENDED' | 'REMOVED' | 'WITHDRAWN';
        comment: string | null;
    } | null;
    summary: {
        content: string;
        updatedAt: string;
        author: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        attachments: Array<{
            id: string;
            name: string;
            type: string;
        }>;
        screenshots: Array<{
            id: string;
            name: string;
            type: string;
            url: string;
        }>;
        readers: Array<{
            id: string;
            firstName: string;
            lastName: string;
        }>;
    };
};

export type FoundSummaryReadersDto = {
    items: Array<{
        id: string;
        firstName: string;
        lastName: string;
        role: 'MEMBRE_DU_SIEGE' | 'MEMBRE_DU_PARQUET' | 'MEMBRE_COMMUN' | 'ADJOINT_SECRETAIRE_GENERAL';
    }>;
};

export type AttachReportFileDto = {
    files: Array<Blob | File>;
};

export type AttachScreenshotsDto = {
    files: Array<Blob | File>;
};

export type AttachedScreenshotsDto = {
    items: Array<{
        id: string;
        name: string;
        url: string;
    }>;
};

export type GetReportFileUrlsResponseDto = {
    items: Array<{
        id: string;
        name: string;
        url: string;
    }>;
};

export type DetailedReportDto = {
    id: string;
    sessionId: string;
    nominationFileId: string;
    name: string;
    comment: string | null;
    formation: 'PARQUET' | 'SIEGE';
    state: 'NEW' | 'IN_PROGRESS' | 'READY_TO_SUPPORT' | 'SUPPORTED';
    folderNumber: number | null;
    biography: string | null;
    dueDate: {
        year: number;
        month: number;
        day: number;
    } | null;
    birthDate: {
        year: number;
        month: number;
        day: number;
    } | null;
    transparency: string;
    dateTransparence: {
        year: number;
        month: number;
        day: number;
    };
    grade: 'I' | 'II' | 'III' | 'HH' | 'G1' | 'G2' | 'G3' | 'G3sup';
    currentPosition: string | null;
    targettedPosition: string | null;
    rank: string | null;
    observers: Array<string>;
    dureeDuPoste: string | null;
    priority: 'ETOILE' | 'OUTRE_MER' | 'PROFILE';
    screenshots: Array<{
        usage: 'EMBEDDED_SCREENSHOT';
        name: string;
        fileId: string;
        url: string;
    }>;
    attachments: Array<{
        usage: 'ATTACHMENT';
        name: string;
        fileId: string;
    }>;
    summary: {
        content: string;
        attachments: Array<{
            fileId: string;
            name: string;
            type: string;
        }>;
        screenshots: Array<{
            fileId: string;
            name: string;
            type: string;
            url: string;
        }>;
    } | null;
    rules: {
        management: {
            [key: string]: {
                id: string;
                validated: boolean;
            };
        };
        qualitative: {
            [key: string]: {
                id: string;
                validated: boolean;
            };
        };
        statutory: {
            [key: string]: {
                id: string;
                validated: boolean;
            };
        };
    };
};

export type UpdateReportDto = {
    comment?: string;
    status?: 'NEW' | 'IN_PROGRESS' | 'READY_TO_SUPPORT' | 'SUPPORTED';
};

export type UpdateReportRuleValidationDto = {
    isValidated: boolean;
};

export type CreateObservationDto = {
    files?: Array<Blob | File>;
    magistratId: string;
    dateReception: string;
};

export type CreateObservationResponseDto = {
    id: string;
};

export type ListObservationsResponseDto = {
    observations: Array<{
        id: string;
        dateReception: string;
        magistrat: {
            id: string;
            firstName: string;
            lastName: string;
            usedName: string;
        } | null;
        createdBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        files: Array<{
            id: string;
            name: string;
        }>;
        createdAt: string;
    }>;
};

export type GetObservationDetailsResponseDto = {
    id: string;
    receptionDate: {
        year: number;
        month: number;
        day: number;
    };
    observant: {
        id: string;
        firstName: string;
        lastName: string;
        usedName: string;
        biography: string | null;
        candidacy: {
            nominationFileId: string;
            desiredPosition: string | null;
            rank: string | null;
        } | null;
    };
    observedMagistrat: {
        name: string;
        proposedPosition: string | null;
    };
    files: Array<{
        id: string;
        name: string;
    }>;
    relatedPropositions: Array<{
        observationId: string;
        nominationFileId: string;
        number: number | null;
        magistratName: string;
        proposedPosition: string | null;
        observationDate: {
            year: number;
            month: number;
            day: number;
        };
    }>;
    memberComment: {
        comment: string;
        screenshots: Array<{
            id: string;
            name: string;
        }>;
    } | null;
};

export type GetObservationFileUrlResponseDto = {
    id: string;
    name: string;
    url: string;
};

export type UpdateObservationDto = {
    files?: Array<Blob | File>;
    magistratId: string;
    dateReception: string;
    detachFileIds?: Array<string>;
};

export type AttachMemberCommentScreenshotsDto = {
    files: Array<Blob | File>;
};

export type AttachedMemberCommentScreenshotsDto = {
    items: Array<{
        id: string;
        name: string;
        url: string;
    }>;
};

export type WriteMemberCommentDto = {
    comment: string;
};

export type SearchMagistratsResponseDto = {
    items: Array<{
        id: string;
        firstName: string;
        lastName: string;
        usedName: string;
        grade: string | null;
        professionalEmail: string | null;
    }>;
    totalCount: number;
    currentPageIndex: number;
    nextPageIndex?: number;
    previousPageIndex?: number;
    links?: {
        next?: string;
        previous?: string;
    };
};

export type GetFileByFileUrlData = {
    body?: never;
    path: {
        fileUrlId: string;
    };
    query?: never;
    url: '/api/files/v1/{fileUrlId}';
};

export type GetFileByFileUrlResponses = {
    200: unknown;
};

export type LoginData = {
    body?: LoginDto;
    path?: never;
    query?: never;
    url: '/api/auth/v2/login';
};

export type LoginResponses = {
    204: void;
};

export type LoginResponse = LoginResponses[keyof LoginResponses];

export type IntrospectSessionData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/api/auth/v2/introspect';
};

export type IntrospectSessionResponses = {
    200: DetailedUserResponseDto;
};

export type IntrospectSessionResponse = IntrospectSessionResponses[keyof IntrospectSessionResponses];

export type LogoutData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/api/auth/v2/logout';
};

export type LogoutResponses = {
    204: void;
};

export type LogoutResponse = LogoutResponses[keyof LogoutResponses];

export type ListSessionsOfTypeGardeDesSceauxData = {
    body?: never;
    path?: never;
    query?: never;
    url: '/api/sessions/v2/garde-des-sceaux';
};

export type ListSessionsOfTypeGardeDesSceauxResponses = {
    200: ListedNominationSessionsDto;
};

export type ListSessionsOfTypeGardeDesSceauxResponse = ListSessionsOfTypeGardeDesSceauxResponses[keyof ListSessionsOfTypeGardeDesSceauxResponses];

export type CreateSessionFromLodamData = {
    body: ImportNominationSessionFromLodamXlsxDto;
    path?: never;
    query?: never;
    url: '/api/sessions/v2/lodam';
};

export type CreateSessionFromLodamResponses = {
    201: CreatedNominationSessionDto;
};

export type CreateSessionFromLodamResponse = CreateSessionFromLodamResponses[keyof CreateSessionFromLodamResponses];

export type UpdateSessionObserversData = {
    body: UpdateNominationSessionFilesObserversDto;
    path: {
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/lodam/{sessionId}/observers';
};

export type UpdateSessionObserversResponses = {
    204: void;
};

export type UpdateSessionObserversResponse = UpdateSessionObserversResponses[keyof UpdateSessionObserversResponses];

export type AffectReportersData = {
    body: AffectReportersDto;
    path: {
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/reporters';
};

export type AffectReportersResponses = {
    204: void;
};

export type AffectReportersResponse = AffectReportersResponses[keyof AffectReportersResponses];

export type ListNominationFilesAsExcelData = {
    body?: never;
    path: {
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files.xlsx';
};

export type ListNominationFilesAsExcelResponses = {
    200: unknown;
};

export type ListNominationFilesData = {
    body?: never;
    path: {
        sessionId: string;
    };
    query?: {
        sortBy?: 'fileNumber' | 'name' | 'targetedPosition' | 'targetedGrade';
        priorities?: Array<'ETOILE' | 'OUTRE_MER' | 'PROFILE' | unknown>;
        reporterIds?: Array<string | unknown>;
        /**
         * true
         */
        sortDesc?: string | boolean;
        page?: number;
        limit?: number;
    };
    url: '/api/sessions/v2/{sessionId}/files';
};

export type ListNominationFilesResponses = {
    200: PaginatedNominationFiles;
};

export type ListNominationFilesResponse = ListNominationFilesResponses[keyof ListNominationFilesResponses];

export type DetailNominationSessionAffectationsVersionData = {
    body?: never;
    path: {
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/reporters/versions/last';
};

export type DetailNominationSessionAffectationsVersionResponses = {
    200: FoundAffectationVersion;
};

export type DetailNominationSessionAffectationsVersionResponse = DetailNominationSessionAffectationsVersionResponses[keyof DetailNominationSessionAffectationsVersionResponses];

export type CountUnaffectedNominationFilesData = {
    body?: never;
    path: {
        sessionId: string;
    };
    query?: {
        nominationFileIds?: string;
    };
    url: '/api/sessions/v2/{sessionId}/files/reporters/versions/last/unaffected-count';
};

export type CountUnaffectedNominationFilesResponses = {
    200: CountedUnaffectedFilesDto;
};

export type CountUnaffectedNominationFilesResponse = CountUnaffectedNominationFilesResponses[keyof CountUnaffectedNominationFilesResponses];

export type ListCurrentlyAffectedReportersData = {
    body?: never;
    path: {
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/reporters/versions/last/members';
};

export type ListCurrentlyAffectedReportersResponses = {
    200: ListedCurrentlyAffectedReportersDto;
};

export type ListCurrentlyAffectedReportersResponse = ListCurrentlyAffectedReportersResponses[keyof ListCurrentlyAffectedReportersResponses];

export type PublishNominationSessionAffectationsVersionData = {
    body?: never;
    path: {
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/reporters/versions';
};

export type PublishNominationSessionAffectationsVersionResponses = {
    204: void;
};

export type PublishNominationSessionAffectationsVersionResponse = PublishNominationSessionAffectationsVersionResponses[keyof PublishNominationSessionAffectationsVersionResponses];

export type AutoAffectationData = {
    body: AutoAffectationDto;
    path: {
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/auto-affectation';
};

export type AutoAffectationResponses = {
    204: void;
};

export type AutoAffectationResponse = AutoAffectationResponses[keyof AutoAffectationResponses];

export type UpdateNominationFileCommentData = {
    body: UpdateCommentDto;
    path: {
        sessionId: string;
        nominationFileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/comment';
};

export type UpdateNominationFileCommentResponses = {
    204: void;
};

export type UpdateNominationFileCommentResponse = UpdateNominationFileCommentResponses[keyof UpdateNominationFileCommentResponses];

export type GetCommentAccessData = {
    body?: never;
    path: {
        sessionId: string;
        nominationFileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/comment-access';
};

export type GetCommentAccessResponses = {
    200: ListCommentAccessDto;
};

export type GetCommentAccessResponse = GetCommentAccessResponses[keyof GetCommentAccessResponses];

export type UpdateCommentAccessData = {
    body: UpdateCommentAccessDto;
    path: {
        sessionId: string;
        nominationFileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/comment-access';
};

export type UpdateCommentAccessResponses = {
    204: void;
};

export type UpdateCommentAccessResponse = UpdateCommentAccessResponses[keyof UpdateCommentAccessResponses];

export type DefineNominationFileOutcomeData = {
    body: DefineNominationFileOutcomeDto;
    path: {
        sessionId: string;
        nominationFileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/outcome';
};

export type DefineNominationFileOutcomeResponses = {
    204: void;
};

export type DefineNominationFileOutcomeResponse = DefineNominationFileOutcomeResponses[keyof DefineNominationFileOutcomeResponses];

export type ListNominationSessionAttachmentsData = {
    body?: never;
    path: {
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/attachments';
};

export type ListNominationSessionAttachmentsResponses = {
    200: ListedNominationSessionAttachmentDto;
};

export type ListNominationSessionAttachmentsResponse = ListNominationSessionAttachmentsResponses[keyof ListNominationSessionAttachmentsResponses];

export type UploadSessionAttachmentData = {
    body: UploadSessionAttachmentDto;
    path: {
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/attachments';
};

export type UploadSessionAttachmentResponses = {
    204: void;
};

export type UploadSessionAttachmentResponse = UploadSessionAttachmentResponses[keyof UploadSessionAttachmentResponses];

export type RemoveSessionAttachmentData = {
    body?: never;
    path: {
        sessionId: string;
        fileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/attachments/{fileId}';
};

export type RemoveSessionAttachmentResponses = {
    204: void;
};

export type RemoveSessionAttachmentResponse = RemoveSessionAttachmentResponses[keyof RemoveSessionAttachmentResponses];

export type CreateNominationSessionAttachmentUrlData = {
    body?: never;
    path: {
        sessionId: string;
        fileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/attachments/{fileId}';
};

export type CreateNominationSessionAttachmentUrlResponses = {
    200: DetailedNominationSessionAttachmentDto;
};

export type CreateNominationSessionAttachmentUrlResponse = CreateNominationSessionAttachmentUrlResponses[keyof CreateNominationSessionAttachmentUrlResponses];

export type DetailsNominationSessionData = {
    body?: never;
    path: {
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}';
};

export type DetailsNominationSessionResponses = {
    200: DetailedNominationSessionDto;
};

export type DetailsNominationSessionResponse = DetailsNominationSessionResponses[keyof DetailsNominationSessionResponses];

export type UpdateNominationSessionData = {
    body: UpdateNominationSessionDto;
    path: {
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}';
};

export type UpdateNominationSessionResponses = {
    204: void;
};

export type UpdateNominationSessionResponse = UpdateNominationSessionResponses[keyof UpdateNominationSessionResponses];

export type GetLolfiMagistratUrlData = {
    body?: never;
    path: {
        sessionId: string;
        nominationFileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/lolfi-url';
};

export type GetLolfiMagistratUrlResponses = {
    200: LolfiMagistratUrlDto;
};

export type GetLolfiMagistratUrlResponse = GetLolfiMagistratUrlResponses[keyof GetLolfiMagistratUrlResponses];

export type ListMembersData = {
    body?: never;
    path?: never;
    query: {
        sortBy?: 'firstName' | 'lastName';
        sortDirection?: 'asc' | 'desc';
        search?: string;
        formations: Array<'SIEGE' | 'PARQUET' | 'COMMUN'>;
        page?: number;
        limit?: number;
    };
    url: '/api/members/v1';
};

export type ListMembersResponses = {
    200: PaginatedMemberListItemDto;
};

export type ListMembersResponse = ListMembersResponses[keyof ListMembersResponses];

export type DetailsMemberData = {
    body?: never;
    path: {
        userId: string;
    };
    query?: never;
    url: '/api/members/v1/{userId}';
};

export type DetailsMemberResponses = {
    200: DetailedMemberDto;
};

export type DetailsMemberResponse = DetailsMemberResponses[keyof DetailsMemberResponses];

export type ExcludeJurisdictionsData = {
    body: ExcludeJurisdictionsDto;
    path: {
        userId: string;
    };
    query?: never;
    url: '/api/members/v1/{userId}/excluded-jurisdictions';
};

export type ExcludeJurisdictionsResponses = {
    204: void;
};

export type ExcludeJurisdictionsResponse = ExcludeJurisdictionsResponses[keyof ExcludeJurisdictionsResponses];

export type ListMemberSessionsData = {
    body?: never;
    path: {
        userId: string;
    };
    query?: never;
    url: '/api/members/v1/{userId}/sessions/transparence/garde-des-sceaux';
};

export type ListMemberSessionsResponses = {
    200: ListedMemberSessionsDto;
};

export type ListMemberSessionsResponse = ListMemberSessionsResponses[keyof ListMemberSessionsResponses];

export type DetailsMemberSessionData = {
    body?: never;
    path: {
        userId: string;
        sessionId: string;
    };
    query?: never;
    url: '/api/members/v1/{userId}/sessions/transparence/garde-des-sceaux/{sessionId}';
};

export type DetailsMemberSessionResponses = {
    200: DetailedMemberSessionDto;
};

export type DetailsMemberSessionResponse = DetailsMemberSessionResponses[keyof DetailsMemberSessionResponses];

export type WriteNominationFileMemberMemoData = {
    body: WriteNominationFileMemberMemoDto;
    path: {
        userId: string;
        sessionId: string;
        nominationFileId: string;
    };
    query?: never;
    url: '/api/members/v1/{userId}/sessions/transparence/garde-des-sceaux/{sessionId}/files/{nominationFileId}/memo';
};

export type WriteNominationFileMemberMemoResponses = {
    204: void;
};

export type WriteNominationFileMemberMemoResponse = WriteNominationFileMemberMemoResponses[keyof WriteNominationFileMemberMemoResponses];

export type SearchData = {
    body?: never;
    path?: never;
    query?: {
        search?: string;
        includeIds?: string;
    };
    url: '/api/jurisdictions/v1';
};

export type SearchResponses = {
    200: ListedJurisdictions;
};

export type SearchResponse = SearchResponses[keyof SearchResponses];

export type DetailSummaryData = {
    body?: never;
    path: {
        sessionId: string;
        nominationFileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary';
};

export type DetailSummaryResponses = {
    200: DetailedSummaryDto;
};

export type DetailSummaryResponse = DetailSummaryResponses[keyof DetailSummaryResponses];

export type CreateSummaryData = {
    body?: never;
    path: {
        sessionId: string;
        nominationFileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary';
};

export type CreateSummaryResponses = {
    201: CreatedSummaryDto;
};

export type CreateSummaryResponse = CreateSummaryResponses[keyof CreateSummaryResponses];

export type DetachSummaryFilesData = {
    body?: never;
    path: {
        sessionId: string;
        nominationFileId: string;
    };
    query: {
        fileIds: Array<string>;
    };
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/attachments';
};

export type DetachSummaryFilesResponses = {
    204: void;
};

export type DetachSummaryFilesResponse = DetachSummaryFilesResponses[keyof DetachSummaryFilesResponses];

export type AttachSummaryFilesData = {
    body: AttachSummaryFilesDto;
    path: {
        sessionId: string;
        nominationFileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/attachments';
};

export type AttachSummaryFilesResponses = {
    204: void;
};

export type AttachSummaryFilesResponse = AttachSummaryFilesResponses[keyof AttachSummaryFilesResponses];

export type IncludeFilesInContentData = {
    body: IncludeFilesInSummaryContentDto;
    path: {
        sessionId: string;
        nominationFileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/screenshots';
};

export type IncludeFilesInContentResponses = {
    200: IncludedFilesInSummaryContentDto;
};

export type IncludeFilesInContentResponse = IncludeFilesInContentResponses[keyof IncludeFilesInContentResponses];

export type WriteSummaryData = {
    body: WriteSummaryContentDto;
    path: {
        sessionId: string;
        nominationFileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/content';
};

export type WriteSummaryResponses = {
    204: void;
};

export type WriteSummaryResponse = WriteSummaryResponses[keyof WriteSummaryResponses];

export type SearchSummaryReadersData = {
    body?: never;
    path: {
        nominationFileId: string;
        sessionId: string;
    };
    query?: {
        search?: string;
        includeIds?: Array<string>;
    };
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/readers';
};

export type SearchSummaryReadersResponses = {
    200: FoundSummaryReadersDto;
};

export type SearchSummaryReadersResponse = SearchSummaryReadersResponses[keyof SearchSummaryReadersResponses];

export type UpdateSummaryReadersListData = {
    body: UpdateSummaryReadersListDto;
    path: {
        sessionId: string;
        nominationFileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/readers';
};

export type UpdateSummaryReadersListResponses = {
    204: void;
};

export type UpdateSummaryReadersListResponse = UpdateSummaryReadersListResponses[keyof UpdateSummaryReadersListResponses];

export type GenerateAttachmentPublicUrlData = {
    body?: never;
    path: {
        sessionId: string;
        nominationFileId: string;
        fileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/summary/attachments/{fileId}/url';
};

export type GenerateAttachmentPublicUrlResponses = {
    200: GeneratedSummaryAttachmentPublicUrlDto;
};

export type GenerateAttachmentPublicUrlResponse = GenerateAttachmentPublicUrlResponses[keyof GenerateAttachmentPublicUrlResponses];

export type DetachFilesData = {
    body?: never;
    path: {
        reportId: string;
    };
    query: {
        fileNames: string | Array<string>;
    };
    url: '/api/reports/v2/{reportId}/files';
};

export type DetachFilesResponses = {
    204: void;
};

export type DetachFilesResponse = DetachFilesResponses[keyof DetachFilesResponses];

export type AttachFilesData = {
    body: AttachReportFileDto;
    path: {
        reportId: string;
    };
    query: {
        usage: 'ATTACHMENT' | 'EMBEDDED_SCREENSHOT';
    };
    url: '/api/reports/v2/{reportId}/files';
};

export type AttachFilesResponses = {
    204: void;
};

export type AttachFilesResponse = AttachFilesResponses[keyof AttachFilesResponses];

export type AttachScreenshotsData = {
    body: AttachScreenshotsDto;
    path: {
        reportId: string;
    };
    query?: never;
    url: '/api/reports/v2/{reportId}/screenshots';
};

export type AttachScreenshotsResponses = {
    200: AttachedScreenshotsDto;
};

export type AttachScreenshotsResponse = AttachScreenshotsResponses[keyof AttachScreenshotsResponses];

export type GetReportFilesUrlData = {
    body?: never;
    path: {
        reportId: string;
    };
    query: {
        fileNames: string | Array<string>;
    };
    url: '/api/reports/v2/{reportId}/files/url';
};

export type GetReportFilesUrlResponses = {
    200: GetReportFileUrlsResponseDto;
};

export type GetReportFilesUrlResponse = GetReportFilesUrlResponses[keyof GetReportFilesUrlResponses];

export type DetailReportData = {
    body?: never;
    path: {
        reportId: string;
    };
    query?: never;
    url: '/api/reports/v2/{reportId}';
};

export type DetailReportResponses = {
    200: DetailedReportDto;
};

export type DetailReportResponse = DetailReportResponses[keyof DetailReportResponses];

export type UpdateReportData = {
    body: UpdateReportDto;
    path: {
        reportId: string;
    };
    query?: never;
    url: '/api/reports/v2/{reportId}';
};

export type UpdateReportResponses = {
    204: void;
};

export type UpdateReportResponse = UpdateReportResponses[keyof UpdateReportResponses];

export type UpdateReportRuleValidationData = {
    body: UpdateReportRuleValidationDto;
    path: {
        reportId: string;
        ruleId: string;
    };
    query?: never;
    url: '/api/reports/v2/{reportId}/rules/{ruleId}';
};

export type UpdateReportRuleValidationResponses = {
    204: void;
};

export type UpdateReportRuleValidationResponse = UpdateReportRuleValidationResponses[keyof UpdateReportRuleValidationResponses];

export type ListObservationsData = {
    body?: never;
    path: {
        nominationFileId: string;
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations';
};

export type ListObservationsResponses = {
    200: ListObservationsResponseDto;
};

export type ListObservationsResponse = ListObservationsResponses[keyof ListObservationsResponses];

export type CreateObservationData = {
    body: CreateObservationDto;
    path: {
        sessionId: string;
        nominationFileId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations';
};

export type CreateObservationResponses = {
    201: CreateObservationResponseDto;
};

export type CreateObservationResponse = CreateObservationResponses[keyof CreateObservationResponses];

export type DeleteObservationData = {
    body?: never;
    path: {
        observationId: string;
        nominationFileId: string;
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}';
};

export type DeleteObservationResponses = {
    204: void;
};

export type DeleteObservationResponse = DeleteObservationResponses[keyof DeleteObservationResponses];

export type GetObservationDetailsData = {
    body?: never;
    path: {
        sessionId: string;
        nominationFileId: string;
        observationId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}';
};

export type GetObservationDetailsResponses = {
    200: GetObservationDetailsResponseDto;
};

export type GetObservationDetailsResponse = GetObservationDetailsResponses[keyof GetObservationDetailsResponses];

export type UpdateObservationData = {
    body: UpdateObservationDto;
    path: {
        observationId: string;
        nominationFileId: string;
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}';
};

export type UpdateObservationResponses = {
    204: void;
};

export type UpdateObservationResponse = UpdateObservationResponses[keyof UpdateObservationResponses];

export type GetObservationFileUrlData = {
    body?: never;
    path: {
        observationId: string;
        fileId: string;
        nominationFileId: string;
        sessionId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}/files/{fileId}/url';
};

export type GetObservationFileUrlResponses = {
    200: GetObservationFileUrlResponseDto;
};

export type GetObservationFileUrlResponse = GetObservationFileUrlResponses[keyof GetObservationFileUrlResponses];

export type AttachMemberCommentScreenshotsData = {
    body: AttachMemberCommentScreenshotsDto;
    path: {
        sessionId: string;
        nominationFileId: string;
        observationId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}/member-comments/screenshots';
};

export type AttachMemberCommentScreenshotsResponses = {
    200: AttachedMemberCommentScreenshotsDto;
};

export type AttachMemberCommentScreenshotsResponse = AttachMemberCommentScreenshotsResponses[keyof AttachMemberCommentScreenshotsResponses];

export type WriteMemberCommentData = {
    body: WriteMemberCommentDto;
    path: {
        sessionId: string;
        nominationFileId: string;
        observationId: string;
    };
    query?: never;
    url: '/api/sessions/v2/{sessionId}/files/{nominationFileId}/observations/{observationId}/member-comments';
};

export type WriteMemberCommentResponses = {
    204: void;
};

export type WriteMemberCommentResponse = WriteMemberCommentResponses[keyof WriteMemberCommentResponses];

export type SearchMagistratsData = {
    body?: never;
    path?: never;
    query?: {
        search?: string;
        page?: number;
        limit?: number;
    };
    url: '/api/magistrats/v1';
};

export type SearchMagistratsResponses = {
    200: SearchMagistratsResponseDto;
};

export type SearchMagistratsResponse = SearchMagistratsResponses[keyof SearchMagistratsResponses];
