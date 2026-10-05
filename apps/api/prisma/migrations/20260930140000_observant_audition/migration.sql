BEGIN;

CREATE TABLE "nominations_context"."observant_audition" (
    "session_id" UUID NOT NULL,
    "magistrat_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "time" TIME(0) NOT NULL,

    CONSTRAINT "observant_audition_pkey" PRIMARY KEY ("session_id", "magistrat_id"),
    CONSTRAINT "observant_audition_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "nominations_context"."session" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "observant_audition_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "nominations_context"."magistrat" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- one row per change of an audition, never updated: who scheduled, moved or removed it and when
-- the auditions scheduled before stay without a version: nobody knows who scheduled them nor when
CREATE TABLE "nominations_context"."observant_audition_version" (
    "session_id" UUID NOT NULL,
    "magistrat_id" UUID NOT NULL,
    "written_at" TIMESTAMP(3) NOT NULL,
    "written_by" UUID,
    "impersonator_id" UUID,
    "date" DATE,
    "time" TIME(0),

    CONSTRAINT "observant_audition_version_pkey" PRIMARY KEY ("session_id", "magistrat_id", "written_at"),
    CONSTRAINT "observant_audition_version_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "nominations_context"."session" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "observant_audition_version_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "nominations_context"."magistrat" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "observant_audition_version_written_by_fkey" FOREIGN KEY ("written_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "observant_audition_version_impersonator_id_fkey" FOREIGN KEY ("impersonator_id") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE TABLE "nominations_context"."nomination_file_audition_version" (
    "nomination_file_id" UUID NOT NULL,
    "written_at" TIMESTAMP(3) NOT NULL,
    "written_by" UUID,
    "impersonator_id" UUID,
    "date" DATE,
    "time" TIME(0),

    CONSTRAINT "nomination_file_audition_version_pkey" PRIMARY KEY ("nomination_file_id", "written_at"),
    CONSTRAINT "nomination_file_audition_version_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "nomination_file_audition_version_written_by_fkey" FOREIGN KEY ("written_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "nomination_file_audition_version_impersonator_id_fkey" FOREIGN KEY ("impersonator_id") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

COMMIT;
