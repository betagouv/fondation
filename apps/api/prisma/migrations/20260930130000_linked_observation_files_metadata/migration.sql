-- a linked observation file is a copy of the row it was linked from, pointing to the same object:
-- it takes the size, author and date of the first row that pointed to that object
BEGIN;

UPDATE "files_context"."files" AS "copy"
SET
    "size_in_bytes" = "source"."size_in_bytes",
    "created_by_id" = "source"."created_by_id",
    "created_at" = "source"."created_at"
FROM (
    SELECT DISTINCT ON ("bucket", "path")
        "bucket",
        "path",
        "size_in_bytes",
        "created_by_id",
        "created_at"
    FROM "files_context"."files"
    ORDER BY "bucket" ASC, "path" ASC, "created_at" ASC
) AS "source"
WHERE
    "copy"."bucket" = "source"."bucket"
    AND "copy"."path" = "source"."path"
    AND "copy"."id" IN (
        SELECT "file_id" FROM "nominations_context"."observation_file"
        WHERE "original_file_id" IS NOT NULL
    );

COMMIT;
