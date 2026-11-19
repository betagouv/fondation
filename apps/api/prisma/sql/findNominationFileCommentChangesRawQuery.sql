-- @param $1:nominationFileIds

SELECT DISTINCT ON (version.nomination_file_id)
    version.nomination_file_id AS "nominationFileId",
    version.written_at AS "writtenAt",
    author.id AS "authorId",
    author.first_name AS "authorFirstName",
    author.last_name AS "authorLastName"
FROM nominations_context.nomination_file_comment_version AS version
LEFT JOIN identity_and_access_context.users AS author
    ON author.id = version.written_by
WHERE version.nomination_file_id = ANY($1::UUID[])
ORDER BY version.nomination_file_id, version.written_at DESC
