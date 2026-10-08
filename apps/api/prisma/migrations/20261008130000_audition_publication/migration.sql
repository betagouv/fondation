BEGIN;

-- one row per publication of the auditions table to the members, never updated
CREATE TABLE "nominations_context"."audition_publication" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "published_by" UUID,
    "impersonator_id" UUID,

    CONSTRAINT "audition_publication_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audition_publication_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "nominations_context"."session" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "audition_publication_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "audition_publication_impersonator_id_fkey" FOREIGN KEY ("impersonator_id") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE TABLE "nominations_context"."published_nomination_file_audition" (
    "publication_id" UUID NOT NULL,
    "nomination_file_id" UUID NOT NULL,
    "date" DATE,
    "requested" BOOLEAN,
    "time" TIME(0),

    CONSTRAINT "published_nomination_file_audition_pkey" PRIMARY KEY ("publication_id", "nomination_file_id"),
    CONSTRAINT "published_nomination_file_audition_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "nominations_context"."audition_publication" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "published_nomination_file_audition_nomination_file_id_fkey" FOREIGN KEY ("nomination_file_id") REFERENCES "nominations_context"."dossier_de_nomination" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE "nominations_context"."published_observant_audition" (
    "publication_id" UUID NOT NULL,
    "magistrat_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "time" TIME(0) NOT NULL,

    CONSTRAINT "published_observant_audition_pkey" PRIMARY KEY ("publication_id", "magistrat_id"),
    CONSTRAINT "published_observant_audition_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "nominations_context"."audition_publication" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "published_observant_audition_magistrat_id_fkey" FOREIGN KEY ("magistrat_id") REFERENCES "nominations_context"."magistrat" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

COMMIT;
