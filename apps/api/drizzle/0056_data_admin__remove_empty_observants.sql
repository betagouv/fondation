BEGIN;

UPDATE nominations_context.dossier_de_nomination
SET content = jsonb_set(content, '{observants}', '[]')
WHERE
    content->'observants' @> '[""]'::jsonb
    AND 
    jsonb_array_length(content->'observants') = 1
;

COMMIT;