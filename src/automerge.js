const core = require('@actions/core');
const GitHub = require('@actions/github');
const semver = require('semver');

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

  console.log(`merge started: ${source} => ${target}`);
  try {
    const commitMessage = config.mergeTpl.replace('{source_branch}', source).replace('{target_branch}', target);

    await github.repos.merge({
      owner: repo.owner,
      repo: repo.repo,
      base: target,
      head: source,
      commit_message: commitMessage
    });
    return true;
  } catch (e) {
    // Merge failed so do a PR instead so the developers can resolve the issue.
    console.log(`merge failed: ${e.message}`);
    console.log('PR to be created instead');

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
    return false;
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

    const branchHierarchy = await findDownStreamBranches(config);

    const mergeSpec = branchHierarchy
      .map((item, idx, _this) => ({ src: item, tgt: _this[idx + 1] }))
      .filter((item) => item.tgt);

    console.log('merges expected', mergeSpec);
    mergeSpec.every((item) => merge(item.src, item.tgt, config));
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;
