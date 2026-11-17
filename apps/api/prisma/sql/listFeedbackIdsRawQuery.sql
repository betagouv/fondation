-- @param $1:words
-- @param $2:statuses
-- @param {DateTime} $3:sentBefore?
-- @param {String} $4:sortBy?
-- @param {Boolean} $5:sortDesc
-- @param {Int} $6:limit
-- @param {Int} $7:offset

WITH matched AS (
  SELECT f.id, f.sent_at, f.status
  FROM nominations_context.feedback AS f
  JOIN identity_and_access_context.users AS author ON author.id = f.author_id
  LEFT JOIN identity_and_access_context.users AS impersonated ON impersonated.id = f.impersonated_id
  WHERE (CARDINALITY($2::TEXT[]) = 0 OR f.status::TEXT = ANY($2::TEXT[]))
    AND ($3::TIMESTAMP IS NULL OR f.sent_at < $3::TIMESTAMP)
    -- every word appears
    AND NOT EXISTS (
      SELECT 1
      FROM UNNEST($1::TEXT[]) AS word
      WHERE STRPOS(
        LOWER(
          UNACCENT(
            CONCAT_WS(
              ' ',
              f.text,
              author.first_name,
              author.last_name,
              impersonated.first_name,
              impersonated.last_name
            )
          )
        ),
        LOWER(UNACCENT(word))
      ) = 0
    )
)
SELECT
  (SELECT COUNT(*) FROM matched)::INT AS "totalCount",
  ARRAY(
    SELECT m.id
    FROM matched AS m
    ORDER BY
      CASE WHEN $4::TEXT = 'status' AND NOT $5::BOOLEAN THEN m.status END ASC,
      CASE WHEN $4::TEXT = 'status' AND $5::BOOLEAN THEN m.status END DESC,
      CASE WHEN $4::TEXT = 'sentAt' AND NOT $5::BOOLEAN THEN m.sent_at END ASC,
      m.sent_at DESC,
      m.id ASC
    LIMIT $6::INT OFFSET $7::INT
  ) AS "ids";
