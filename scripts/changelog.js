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

const HTML_ESCAPES = { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' };

/**
 * @typedef {object} Format
 * @property {(text: string) => string} code
 * @property {(text: string) => string} escape
 * @property {(line: string) => string} item
 * @property {(text: string, url: string) => string} link
 * @property {(items: string[]) => string} list
 */

/** @type {Record<'html' | 'markdown', Format>} */
const FORMATS = {
  html: {
    code: (text) => `<code>${text}</code>`,
    escape: (text) => text.replace(/["&<>]/g, (char) => HTML_ESCAPES[char]),
    item: (line) => `<li>${line}</li>`,
    link: (text, url) => `<a href="${url}">${text}</a>`,
    list: (items) => `<ul>${items.join('')}</ul>`,
  },
  markdown: {
    code: (text) => `\`${text}\``,
    escape: (text) => text,
    item: (line) => `- ${line}`,
    link: (text, url) => `[${text}](${url})`,
    list: (items) => items.join('\n'),
  },
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

/** @param {string} commit @param {Format} format @returns {string} */
function decorateCommit(commit, format) {
  let outputCommit = format.escape(commit);

  const hashRe = /^(?<hash>\w+)\b/;
  outputCommit = outputCommit.replace(hashRe, (...args) => {
    const { hash } = args.at(-1);
    return format.code(hash);
  });

  const issueRe = new RegExp(`(?<type>fix|feat|refactor|docs|chore)\\((?<issueId>${TRGM}-\\d+)\\): `);
  outputCommit = outputCommit.replace(issueRe, (...args) => {
    const { type, issueId } = args.at(-1);
    if (!/0+$/.test(issueId)) {
      return `${type}(${format.link(issueId, TEMPLATES.ISSUE(issueId))}): `;
    }

    return args.at(0);
  });

  const prRe = /(?<message>.+) \(#(?<prId>\d+)\)$/;
  outputCommit = outputCommit.replace(prRe, (...args) => {
    const { message, prId } = args.at(-1);
    return `${message} (${format.link(`#${prId}`, TEMPLATES.PR(prId))})`;
  });

  const repoIssueRe = /(?<magic>closes|resolves) #(?<issueId>\d+)/;
  outputCommit = outputCommit.replace(repoIssueRe, (_match, magic, issueId) => {
    return `${magic} ${format.link(`#${issueId}`, TEMPLATES.REPO_ISSUE(issueId))}`;
  });

  return outputCommit;
}

function main() {
  const [head, source] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  assert.ok(typeof head === 'string', 'head expected a commit');
  assert.ok(typeof source === 'string', 'source expected a commit');

  const format = process.argv.includes('--html') ? FORMATS.html : FORMATS.markdown;
  const commits = logCommits([source, head]).map((x) => format.item(decorateCommit(x, format)));

  console.log(format.list(commits));
}

main();
