const assert = require('node:assert');
const { execSync } = require('node:child_process');

const TRGM = 'FON';
const TEMPLATES = {
  /** @param {string} id @returns {string} */
  ISSUE: (id) => `https://notion.so/${id}`,
  /** @param {string} id @returns {string} */
  PR: (id) => `https://github.com/betagouv/fondation/pull/${id}`,
  /** @param {string} id @returns {string} */
  REPO_ISSUE: (id) => `https://github.com/betagouv/fondation/issue/${id}`,
};

/** @param {[string, string]} commandRange @returns {string[]} */
function logCommits(commandRange) {
  /** @type string */
  const list = execSync(`git log --pretty='%h %s' ${commandRange[0]}..${commandRange[1]}`, {
    encoding: 'utf-8',
  });

  return list
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
}

/** @param {string} commit @returns {string} */
function decorateCommit(commit) {
  let outputCommit = commit;

  const hashRe = /^(?<hash>\w+)\b/;
  outputCommit = outputCommit.replace(hashRe, (...args) => {
    const { hash } = args.at(-1);
    return `\`${hash}\``;
  });

  const issueRe = new RegExp(`(?<type>fix|feat|refactor|docs|chore)\\((?<issueId>${TRGM}-\\d+)\\): `);
  outputCommit = outputCommit.replace(issueRe, (...args) => {
    const { type, issueId } = args.at(-1);
    if (!/0+$/.test(issueId)) {
      return `${type}([${issueId}](${TEMPLATES.ISSUE(issueId)})): `;
    }

    return args.at(0);
  });

  const prRe = /(?<message>.+) \(#(?<prId>\d+)\)$/;
  outputCommit = outputCommit.replace(prRe, (...args) => {
    const { message, prId } = args.at(-1);
    return `${message} ([#${prId}](${TEMPLATES.PR(prId)}))`;
  });

  const repoIssueRe = /(?<magic>closes|resolves) #(?<issueId>\d+)/;
  outputCommit = outputCommit.replace(repoIssueRe, (_match, magic, issueId, offset, str) => {
    const offsetEnd = offset + magic.length + 2 + issueId.length;
    console.log({ _match, magic, issueId, offset, str, offsetEnd });
    return magic + ' ' + `[#${issueId}](${TEMPLATES.REPO_ISSUE(issueId)})`;
  });

  return outputCommit;
}

function main() {
  const head = process.argv[2];
  assert.ok(typeof head === 'string', 'head expected a commit');

  const source = process.argv[3];
  assert.ok(typeof source === 'string', 'source expected a commit');

  const commits = logCommits([source, head])
    .map((x) => `- ${decorateCommit(x)}`)
    .join('\n');

  console.log(commits);
}

main();
