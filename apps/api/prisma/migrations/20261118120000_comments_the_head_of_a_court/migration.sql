-- CreateTable
CREATE TABLE "nominations_context"."court_comment" (
    "author_id" UUID,
    "comment" TEXT NOT NULL,
    "court_id" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "court_comment_pkey" PRIMARY KEY ("court_id")
);

-- AddForeignKey
ALTER TABLE "nominations_context"."court_comment" ADD CONSTRAINT "court_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "identity_and_access_context"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "nominations_context"."court_comment" ADD CONSTRAINT "court_comment_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "data_administration_context"."jurisdictions"("codejur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- the comments already written on the head of a court follow it. Two holders of the same court during a handover
-- keep both comments, the latest first, under the author and the date of the latest. The comment of a holder LOLFI
-- moved or let go stays out: an import that stopped before purging it left it behind
INSERT INTO "nominations_context"."court_comment" ("author_id", "comment", "court_id", "updated_at")
SELECT
  (ARRAY_AGG(pc."author_id" ORDER BY pc."updated_at" DESC))[1],
  STRING_AGG(pc."comment", E'\n\n' ORDER BY pc."updated_at" DESC),
  p."jurisdiction_id",
  MAX(pc."updated_at")
FROM "nominations_context"."position_comment" AS pc
  INNER JOIN "data_administration_context"."position" AS p ON p."id" = pc."position_id"
  INNER JOIN "data_administration_context"."magistrat" AS m ON m."id" = pc."magistrat_id"
WHERE (p."jurisdiction_type_id", p."function_id") IN (('CA', 'PP'), ('TSA', 'P'), ('TJ', 'P'), ('TPI', 'P'))
  AND m."status" = 'ACTIVE'
  AND NULLIF(m."current_position_id", '')::INT = pc."position_id"
GROUP BY p."jurisdiction_id";

DELETE FROM "nominations_context"."position_comment" AS pc
USING "data_administration_context"."position" AS p
WHERE p."id" = pc."position_id"
  AND (p."jurisdiction_type_id", p."function_id") IN (('CA', 'PP'), ('TSA', 'P'), ('TJ', 'P'), ('TPI', 'P'));
