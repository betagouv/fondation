BEGIN;

CREATE TABLE "docs"."official_report_version_skipped_update" (
    "version_id" UUID NOT NULL,
    "cause" "docs"."doc_system_update_cause_enum" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "official_report_version_skipped_update_pkey" PRIMARY KEY ("version_id", "cause"),
    CONSTRAINT "official_report_version_skipped_update_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "docs"."official_report_version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

COMMIT;
