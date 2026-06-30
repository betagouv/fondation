BEGIN;

-- AlterTable
ALTER TABLE "nominations_context"."session"
    ALTER COLUMN "session_import_id" SET DEFAULT gen_random_uuid()::text,
    ALTER COLUMN "observations_closing_date" DROP NOT NULL;

/** WARNING: breaking change, potential data loss during migration (a 10m window) */

-- CreateTable
CREATE TABLE "nominations_context"."session_transparence_gds" (
    "session_id" UUID NOT NULL,
    "due_date" DATE,
    "position_start_date" DATE,
    "observations_closing_date" DATE NOT NULL,
    "lolfi_session_id" INTEGER,

    CONSTRAINT "session_transparence_gds_pkey" PRIMARY KEY ("session_id")
);

INSERT INTO "nominations_context"."session_transparence_gds" (
    "session_id",
    "due_date",
    "position_start_date",
    "observations_closing_date",
    "lolfi_session_id"
)
SELECT id, due_date, position_start_date, observations_closing_date, lolfi_session_id
FROM "nominations_context"."session";

-- CreateIndex
CREATE INDEX "session_transparence_gds_lolfi_session_id_idx" ON "nominations_context"."session_transparence_gds"("lolfi_session_id");

-- CreateIndex
CREATE INDEX "session_type_de_saisine_idx" ON "nominations_context"."session"("type_de_saisine");

-- AddForeignKey
ALTER TABLE "nominations_context"."session_transparence_gds"
    ADD CONSTRAINT "session_transparence_gds_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "nominations_context"."session"("id")
    ON DELETE CASCADE
    ON UPDATE NO ACTION;

COMMIT;