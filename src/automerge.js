const core = require('@actions/core');
const GitHub = require('@actions/github');
const semver = require('semver');

const MERGE_ACTIONS = {
  NONE: 'none',
  MERGE: 'merge',
  REQUEST: 'request'
};

/**
 *
 * @param config
 * @returns {Promise<array>}
 */
async function getBranchHierarchy(config) {
  // Get owner and repo from context of payload that triggered the action
  const { owner: currentOwner, repo: currentRepo } = GitHub.context.repo;

  // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
  const github = GitHub.getOctokit(process.env.GITHUB_TOKEN);

  const { data: branches } = await github.repos.listBranches({ owner: currentOwner, repo: currentRepo });

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
 * @param config {prod: string, dev: string, pattern: string, strategy}
 * @returns {Promise<{action: string, source: string, target: string}>}
 */
async function findDownStreamBranch(config) {
  const branchHierarchy = await getBranchHierarchy(config);
  const { ref: currentBranchRef } = GitHub.context.repo;
  const srcBranch = currentBranchRef.split('refs/heads/')[1];

  console.log(branchHierarchy, srcBranch, config);
  const nextBranchIndex = branchHierarchy.indexOf(srcBranch) + 1;

  if (nextBranchIndex === 0 || nextBranchIndex === branchHierarchy.length) {
    return {
      source: srcBranch,
      target: '',
      action: MERGE_ACTIONS.NONE
    };
  }
  else {
    return {
      source: srcBranch,
      target: branchHierarchy[nextBranchIndex],
      action: MERGE_ACTIONS.MERGE
    };
  }
}

async function run() {
  try {
    const config = {
      prod: core.getInput('production-branch', { required: false }) || 'master',
      dev: core.getInput('development-branch', { required: false }) || '',
      pattern: core.getInput('merge-pattern', { required: false }) || 'release/',
      strategy: core.getInput('merge-strategy', { required: false }) || 'merge-no-ff'
    };

    const mergeSpec = await findDownStreamBranch(config);

    console.log(mergeSpec);

    core.setOutput('details', '');
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;
