const core = require('@actions/core')
const GitHub = require('@actions/github')
const semver = require('semver')

/**
 *
 * @param config
 * @returns {Promise<array>}
 */
async function getBranchHierarchy(config) {
  // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
  const github = GitHub.getOctokit(process.env.GITHUB_TOKEN)

  const { data: branches } = await github.repos.listBranches(GitHub.context.repo)

  // check to make sure the API returned the correct data type
  if (!Array.isArray(branches)) {
    throw new Error('Expected Array of branches from GitHub API')
  }

  const sorted = branches
    .map(item => item.name) // we only care about branch names
    .filter(item => item.startsWith(config.pattern)) // ignore non-release branches for sort
    .map(item => item.split(config.pattern)[1]) // version compare needs the prefix removed
    .filter(semver.valid) // remove any branches that will not be valid for sorting upon
    .sort(semver.compare) // sorts lowest to highest version
    .map(item => config.pattern + item) // put the release branch pattern back

  // put prod branch name at front of branch list
  sorted.unshift(config.prod)

  // put dev branch at back of branch list, if it was set
  if (`${config.dev}` !== '') {
    sorted.push(config.dev)
  }

  return sorted
}

/**
 *
 * @param config
 * @returns {Promise<[string]>}
 */
async function findDownStreamBranches(config) {
  const branchHierarchy = await getBranchHierarchy(config)
  const srcBranch = GitHub.context.ref.split('refs/heads/')[1]

  // console.log(`branchHierarchy: [${branchHierarchy.join(', ')}]`, `Source Branch: ${srcBranch}`);
  return branchHierarchy.slice(branchHierarchy.indexOf(srcBranch))
}

/**
 *
 * @param source
 * @param target
 * @param config
 * @returns {Promise<boolean>}
 */
async function merge(source, target, config) {
  // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
  const github = GitHub.getOctokit(process.env.GITHUB_TOKEN)
  const { repo } = GitHub.context

  let result = true

  try {
    const commitMessage = config.mergeTpl.replace('{source_branch}', source).replace('{target_branch}', target)

    await github.repos.merge({
      owner: repo.owner,
      repo: repo.repo,
      base: target,
      head: source,
      commit_message: commitMessage
    })
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    // console.log(`merge failed: ${e.message}`)
    result = false
  }

  return result
}

/**
 *
 * @param source
 * @param target
 * @param config
 * @returns {Promise<boolean>}
 */
async function mergeRequest(source, target, config) {
  // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
  const github = GitHub.getOctokit(process.env.GITHUB_TOKEN)
  const { repo } = GitHub.context

  let result = true

  try {
    const prTitle = config.prTpl.replace('{source_branch}', source).replace('{target_branch}', target)

    await github.pulls.create({
      owner: repo.owner,
      repo: repo.repo,
      base: target,
      head: source,
      title: prTitle
    })
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    // console.log(`merge failed: ${e.message}\n\nPR created instead`);
    result = false
  }

  return result
}

/**
 *
 * @returns {Promise<void>}
 */
async function run() {
  const actionsTaken = []

  const config = {
    prod: core.getInput('production-branch') || 'master',
    dev: core.getInput('development-branch') || '',
    pattern: core.getInput('release-pattern') || 'release/',
    mergeTpl: core.getInput('merge-message-template'),
    prOnFail: core.getInput('pr-on-failed-merge').trim().toLowerCase() === 'yes',
    prTpl: core.getInput('pr-title-template')
  }

  const branchHierarchy = await findDownStreamBranches(config)

  const mergeSpec = branchHierarchy
    .map((item, idx, _this) => ({ src: item, tgt: _this[idx + 1] }))
    .filter(item => item.tgt)

  // normally one might want to continue the chain with .every(), but the mergeSpec must
  // be done serially to properly terminate the chain for a failed merge or if a PR should
  // be created due to a failed merge, which also terminates the downstream auto-merge process

  for (let i = 0; i < mergeSpec.length; i += 1) {
    const item = mergeSpec[i]

    /* eslint-disable no-await-in-loop */
    if (await merge(item.src, item.tgt, config)) {
      actionsTaken.push(`Merged ${item.src} into ${item.tgt}`)
    } else if (config.prOnFail && (await mergeRequest(item.src, item.tgt, config))) {
      actionsTaken.push(`Pull Request Created for ${item.src} into ${item.tgt}`)
      break // out of mergeSpec loop since a PR was
    } else {
      actionsTaken.push(`unable merge or create a merge request for ${item.src} into ${item.tgt}`)
      core.setFailed(`Both Merge and Pull Requests failed`)
      break
    }
    /* eslint-enable no-await-in-loop */
  }
  core.setOutput('details', actionsTaken.join('\n'))
}

module.exports = run
