const core = require('@actions/core');
const GitHub = require('@actions/github');
const semver = require('semver');

const MERGE_ACTIONS = {
  NONE: 'NONE',
  MERGE: 'MERGE',
  REQUEST: 'REQUEST'
};

/**
 *
 * @param config
 * @returns {Promise<array>}
 */
async function getBranchHierarchy(config) {
  // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
  const github = GitHub.getOctokit(process.env.GITHUB_TOKEN);

  const { data: branches } = await github.repos.listBranches(GitHub.context.repo);

  // check to make sure the API returned the correct data type
  if (!Array.isArray(branches)) {
    throw new Error('Expected Array of branches from GitHub API');
  }

  const sorted = branches
    .map((item) => item.name) // we only care about branch names
    .filter((item) => item.startsWith(config.pattern)) // ignore non-release branches for sort
    .map((item) => item.split(config.pattern)[1]) // version compare needs the prefix removed
    .filter(semver.valid) // remove any branches that will not be valid for sorting upon
    .sort(semver.compare) // sorts lowest to highest version
    .map((item) => config.pattern + item); // put the release branch pattern back

  // put prod branch name at front of branch list
  sorted.unshift(config.prod);

  // put dev branch at back of branch list, if it was set
  if (`${config.dev}` !== '') {
    sorted.push(config.dev);
  }

  return sorted;
}

/**
 *
 * @param config
 * @returns {Promise<[string]>}
 */
async function findDownStreamBranches(config) {
  const branchHierarchy = await getBranchHierarchy(config);
  const srcBranch = GitHub.context.ref.split('refs/heads/')[1];

  // console.log(`branchHierarchy: [${branchHierarchy.join(', ')}]`, `Source Branch: ${srcBranch}`);
  return branchHierarchy.slice(branchHierarchy.indexOf(srcBranch));
}

/**
 *
 * @param source string
 * @param target string
 * @param config
 * @returns {Promise<boolean>}
 */
async function merge(source, target, config) {
  // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
  const github = GitHub.getOctokit(process.env.GITHUB_TOKEN);
  const { repo } = GitHub.context;

  try {
    const commitMessage = config.mergeTpl.replace('{source_branch}', source).replace('{target_branch}', target);

    const { data: result } = await github.repos.merge({
      owner: repo.owner,
      repo: repo.repo,
      base: target,
      head: source,
      commit_message: commitMessage
    });

    console.log('commit result', result);
    return MERGE_ACTIONS.MERGE;
  } catch (e) {
    // Merge failed so do a PR instead so the developers can resolve the issue.
    const prTitle = config.prTpl.replace('{source_branch}', source).replace('{target_branch}', target);

    const { data: result } = await github.pulls.create({
      owner: repo.owner,
      repo: repo.repo,
      base: target,
      head: source,
      title: prTitle,
      body: `${e.name}: ${e.message}`
    });

    console.log('pr result', result);
    return MERGE_ACTIONS.REQUEST;
  }
}

/**
 *
 * @returns {Promise<void>}
 */
async function run() {
  try {
    const config = {
      prod: core.getInput('production-branch') || 'master',
      dev: core.getInput('development-branch') || '',
      pattern: core.getInput('release-pattern') || 'release/',
      mergeTpl: core.getInput('merge-message-template'),
      prTpl: core.getInput('pr-title-template')
    };
    // console.log('CONFIG Object', config);

    const branchHierarchy = await findDownStreamBranches(config);

    branchHierarchy
      .map((item, idx, _this) => ({ src: item, tgt: _this[idx + 1] }))
      .filter((item) => item.tgt)
      .every((mergeSpec) => merge(mergeSpec.src, mergeSpec.tgt, config) === MERGE_ACTIONS.MERGE);
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;
