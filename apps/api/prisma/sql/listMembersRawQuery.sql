-- @param {String} $2:search?
-- @param {String} $3:sortBy?
-- @param {String} $4:sortDirection?
-- @param {Int} $5:limit
-- @param {Int} $6:offset
-- @param {Boolean} $7:includesActive
-- @param {Boolean} $8:includesDeactivated

SELECT
  m.id,
  m."role",
  m.first_name AS "firstName",
  m.last_name AS "lastName",
  m.deactivated_at AS "deactivatedAt",
  COALESCE(excluded.jurisdictions, ARRAY[]::JSONB[])::JSONB[] AS "excludedJurisdictions"
FROM
  identity_and_access_context."users" AS m

  LEFT JOIN LATERAL (
    SELECT
      ARRAY_AGG(
        JSONB_BUILD_OBJECT(
          'id', j.codejur,
          'label', j.libelle
        )
      ) FILTER (WHERE j.codejur IS NOT NULL) AS jurisdictions
    FROM identity_and_access_context.excluded_jurisdictions AS ej
      LEFT JOIN data_administration_context.jurisdictions AS j
        ON j.codejur = ej.jurisdiction_id
    WHERE ej.user_id = m.id
    GROUP BY ej.user_id
  ) AS excluded ON TRUE

WHERE (
  m."role" = ANY($1)
  AND (CASE WHEN m.deactivated_at IS NULL THEN $7::BOOLEAN ELSE $8::BOOLEAN END)
  AND ($2::TEXT IS NULL OR (
    m.email ILIKE '%' || $2::TEXT || '%'
    OR m.first_name ILIKE '%' || $2::TEXT || '%'
    OR m.last_name ILIKE '%' || $2::TEXT || '%'
  ))
)

ORDER BY (
  CASE
    WHEN $3::TEXT IS NOT NULL AND $4::TEXT = 'desc' THEN
      CASE
        WHEN $3::TEXT = 'firstName' THEN m.first_name
        ELSE m.last_name
      END
  END
) DESC, (
  CASE
    WHEN $3::TEXT = 'firstName' THEN m.first_name
    ELSE m.last_name
  END
) ASC, m.id ASC

LIMIT $5::INT OFFSET $6::INT;
