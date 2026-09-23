BEGIN;

-- the link table becomes the only trace of an agenda's notices: keep any link the column alone carried
INSERT INTO "docs"."justice_presentation_plan_to_agenda" ("plan_id", "agenda_id")
SELECT "justice_presentation_plan_id", "id"
FROM "docs"."agenda"
WHERE "justice_presentation_plan_id" IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE "docs"."justice_presentation_plan_to_agenda" DROP CONSTRAINT "justice_presentation_plan_to_agenda_plan_id_agenda_id_fkey";

DROP INDEX "docs"."agenda_justice_presentation_plan_id_id_key";

DROP INDEX "docs"."justice_presentation_plan_to_agenda_agenda_id_key";

ALTER TABLE "docs"."agenda" DROP COLUMN "justice_presentation_plan_id";

CREATE INDEX "justice_presentation_plan_to_agenda_agenda_id_idx" ON "docs"."justice_presentation_plan_to_agenda" ("agenda_id");

ALTER TABLE "docs"."justice_presentation_plan_to_agenda"
    ADD CONSTRAINT "justice_presentation_plan_to_agenda_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "docs"."agenda" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

CREATE TABLE "docs"."justice_presentation_plan_removed_agenda" (
    "plan_id" UUID NOT NULL,
    "agenda_id" UUID NOT NULL,
    "taken_by_plan_id" UUID NOT NULL,
    "removed_at" TIMESTAMP(3) NOT NULL,
    "removed_by" UUID,

    CONSTRAINT "justice_presentation_plan_removed_agenda_pkey" PRIMARY KEY ("plan_id", "agenda_id"),
    CONSTRAINT "justice_presentation_plan_removed_agenda_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "docs"."justice_presentation_plan" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "justice_presentation_plan_removed_agenda_taken_by_plan_id_fkey" FOREIGN KEY ("taken_by_plan_id") REFERENCES "docs"."justice_presentation_plan" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "justice_presentation_plan_removed_agenda_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "docs"."agenda" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "justice_presentation_plan_removed_agenda_removed_by_fkey" FOREIGN KEY ("removed_by") REFERENCES "identity_and_access_context"."users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

COMMIT;
