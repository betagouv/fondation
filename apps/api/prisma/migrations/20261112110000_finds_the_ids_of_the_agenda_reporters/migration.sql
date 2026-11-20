-- the rows written before the ids were kept name each reporter as « M. <first name> <LAST NAME> »:
-- a name gets the id of the one reporter of the file who bears its civility and last name, so a
-- rename made since then is told apart from a new reporter. A name matching nobody, or more than one
-- member, keeps a null id and goes on being compared by name.
UPDATE "docs"."agenda_nomination_file" AS anf
SET "reporters" = (
    SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT('id', COALESCE(named.member ->> 'id', found.id), 'name', named.member ->> 'name')
        ORDER BY named.position
    )
    FROM JSONB_ARRAY_ELEMENTS(anf."reporters") WITH ORDINALITY AS named (member, position)
        LEFT JOIN LATERAL (
            SELECT MIN(u.id::TEXT) AS id
            FROM "nominations_context"."nomination_file_to_reporter" AS nfr
                INNER JOIN "identity_and_access_context"."users" AS u ON u.id = nfr.user_id
            WHERE
                nfr.nomination_file_id = anf.nomination_file_id
                AND STARTS_WITH(named.member ->> 'name', CASE u.gender WHEN 'FEMALE' THEN 'Mme' ELSE 'M.' END || U&'\00A0')
                AND RIGHT(named.member ->> 'name', LENGTH(u.last_name) + 1) = U&'\00A0' || UPPER(u.last_name)
            HAVING COUNT(DISTINCT u.id) = 1
        ) AS found ON TRUE
)
WHERE anf."reporters" @> '[{"id": null}]';
