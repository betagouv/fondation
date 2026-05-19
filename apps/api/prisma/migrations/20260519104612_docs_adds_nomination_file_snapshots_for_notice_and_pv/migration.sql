BEGIN;

-- Snapshot des nomination files pour les Notices de restitution (JusticePresentationPlan)
CREATE TABLE "docs"."justice_presentation_plan_nomination_file" (
    "id"                 BIGSERIAL PRIMARY KEY,
    "plan_id"            UUID NOT NULL,
    "nomination_file_id"  UUID,
    "session_id"         UUID NOT NULL,
    "session_name"       TEXT NOT NULL,
    "number"             INTEGER NOT NULL,
    "name"               TEXT NOT NULL,
    "grade"              TEXT NOT NULL,
    "position"           TEXT,
    "targeted_position"  TEXT,
    "targeted_grade"     TEXT NOT NULL,
    "outcome"            "docs"."agenda_file_outcome_enum" NOT NULL,
    "outcome_comment"    TEXT,
    "reporters"          TEXT[] NOT NULL,
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "justice_presentation_plan_nomination_file_plan_id_fkey"
        FOREIGN KEY ("plan_id")
        REFERENCES "docs"."justice_presentation_plan"("id")
        ON DELETE CASCADE,
    CONSTRAINT "justice_presentation_plan_nomination_file_nomination_file__fkey"
        FOREIGN KEY ("nomination_file_id")
        REFERENCES "nominations_context"."dossier_de_nomination"("id")
        ON DELETE SET NULL
);

-- Snapshot des nomination files pour les PV de restitution (OfficialReport)
CREATE TABLE "docs"."official_report_nomination_file" (
    "id"                 BIGSERIAL PRIMARY KEY,
    "official_report_id" UUID NOT NULL,
    "nomination_file_id" UUID,
    "number"             INTEGER NOT NULL,
    "name"               TEXT NOT NULL,
    "grade"              TEXT NOT NULL,
    "position"           TEXT,
    "targeted_position"  TEXT,
    "targeted_grade"     TEXT NOT NULL,
    "outcome"            "docs"."agenda_file_outcome_enum" NOT NULL,
    "outcome_comment"    TEXT,
    "reporters"          TEXT[] NOT NULL,
    "created_at"         TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updated_at"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "official_report_nomination_file_official_report_id_fkey"
        FOREIGN KEY ("official_report_id")
        REFERENCES "docs"."official_report"("id")
        ON DELETE CASCADE,
    CONSTRAINT "official_report_nomination_file_nomination_file_id_fkey"
        FOREIGN KEY ("nomination_file_id")
        REFERENCES "nominations_context"."dossier_de_nomination"("id")
        ON DELETE SET NULL
);

COMMIT;
