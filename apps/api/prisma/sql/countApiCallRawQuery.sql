-- @param {String} $1:caller
-- @param {String} $2:route
-- @param {DateTime} $3:minute

-- A single statement: simultaneous calls, from any container, each get their own count
INSERT INTO identity_and_access_context.api_rate_counters (caller, route, minute, count)
VALUES ($1, $2, $3, 1)
ON CONFLICT (caller, route, minute) DO UPDATE SET count = api_rate_counters.count + 1
RETURNING count;
