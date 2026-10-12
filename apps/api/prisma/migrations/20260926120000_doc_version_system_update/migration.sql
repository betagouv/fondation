BEGIN;

-- the drafts updated before only keep the date of their last update, without its reasons
CREATE TYPE "docs"."doc_system_update_cause_enum" AS ENUM ('AGENDA_DATE', 'AGENDA_PROPOSITIONS', 'AGENDA_TEXT', 'OUTCOME', 'REPORTERS', 'SESSION_DATE');

CREATE TABLE "docs"."agenda_version_system_update" (
    "version_id" UUID NOT NULL,
    "cause" "docs"."doc_system_update_cause_enum" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_version_system_update_pkey" PRIMARY KEY ("version_id", "cause"),
    CONSTRAINT "agenda_version_system_update_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "docs"."agenda_version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE "docs"."official_report_version_system_update" (
    "version_id" UUID NOT NULL,
    "cause" "docs"."doc_system_update_cause_enum" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "official_report_version_system_update_pkey" PRIMARY KEY ("version_id", "cause"),
    CONSTRAINT "official_report_version_system_update_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "docs"."official_report_version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

COMMIT;
