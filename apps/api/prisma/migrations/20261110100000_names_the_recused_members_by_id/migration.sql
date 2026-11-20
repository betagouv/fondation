-- a rename tells apart from a new recusal by the member's id: the rows written before only know the name
ALTER TABLE "docs"."official_report_nomination_file"
    ADD COLUMN "recused_members_by_id" JSONB NOT NULL DEFAULT '[]'::JSONB;

UPDATE "docs"."official_report_nomination_file"
SET "recused_members_by_id" = (
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('id', NULL, 'name', member.name) ORDER BY member.position), '[]'::JSONB)
    FROM UNNEST("recused_members") WITH ORDINALITY AS member (name, position)
);

ALTER TABLE "docs"."official_report_nomination_file" DROP COLUMN "recused_members";
ALTER TABLE "docs"."official_report_nomination_file" RENAME COLUMN "recused_members_by_id" TO "recused_members";
