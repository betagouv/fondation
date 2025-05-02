BEGIN;

CREATE TABLE "data_administration_context"."transparences" (
	"id" "transparency" PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"formations" formation[] NOT NULL,
	"nomination_files_ids" jsonb[] NOT NULL
);

WITH distinct_transparencies AS (
    SELECT 
        DISTINCT (content ->> 'transparency')::transparency as transparency_id,
        array_agg(jsonb_build_object(
            'id', id,
            'createdAt', created_at,
            'rowNumber', row_number,
            'content', content - 'transparency'
        )) as nomination_files_array,
        array_agg(DISTINCT (content ->> 'formation')::formation) as formations
    FROM data_administration_context.nomination_files
    GROUP BY (content ->> 'transparency')
)
INSERT INTO data_administration_context.transparences (id, created_at, formations, nomination_files_ids)
SELECT 
    dt.transparency_id,
    NOW(),
    dt.formations,
    dt.nomination_files_array
FROM distinct_transparencies dt;

COMMIT;