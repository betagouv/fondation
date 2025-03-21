BEGIN;

ALTER TABLE "reports_context"."reports" ADD COLUMN "attached_files" jsonb;

-- Populate the attached_files column by aggregating files for each report
UPDATE "reports_context"."reports" r
SET "attached_files" = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'fileId', af."file_id", 
            'name', af."name",
            'usage', 'ATTACHMENT'
        )
    )
    FROM "reports_context"."attached_files" af
    WHERE af."report_id" = r."id"
);

DROP TABLE "reports_context"."attached_files";

COMMIT;