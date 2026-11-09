-- a rename tells apart from a new reporter by the member's id: the rows written before only know the name
ALTER TABLE "docs"."official_report_nomination_file"
    ADD COLUMN "reporters_by_id" JSONB NOT NULL DEFAULT '[]'::JSONB;

UPDATE "docs"."official_report_nomination_file"
SET "reporters_by_id" = (
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT('id', NULL, 'name', reporter.name) ORDER BY reporter.position), '[]'::JSONB)
    FROM UNNEST("reporters") WITH ORDINALITY AS reporter (name, position)
);

ALTER TABLE "docs"."official_report_nomination_file" DROP COLUMN "reporters";
ALTER TABLE "docs"."official_report_nomination_file" ALTER COLUMN "reporters_by_id" DROP DEFAULT;
ALTER TABLE "docs"."official_report_nomination_file" RENAME COLUMN "reporters_by_id" TO "reporters";
