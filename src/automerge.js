const core = require('@actions/core');
const { GitHub, context } = require('@actions/github');

async function run() {
  try {
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const github = new GitHub(process.env.GITHUB_TOKEN);

    // Get owner and repo from context of payload that triggered the action
    const { owner: currentOwner, repo: currentRepo } = context.repo;

    const prodBranch = core.getInput('production-branch', { required: false }) || 'master';
    const devBranch = core.getInput('development-branch', { required: false }) || 'develop';
    const mergePattern = core.getInput('merge-pattern', { required: false }) || 'release/';
    const mergeStrategy = core.getInput('merge-strategy', { required: false }) || 'merge-no-ff';

    const owner = core.getInput('owner', { required: false }) || currentOwner;
    const repo = core.getInput('repo', { required: false }) || currentRepo;

    const branchList = await github.repos.listBranches({
      owner,
      repo
    });

    console.log(prodBranch, devBranch, mergePattern, mergeStrategy, owner, repo, branchList);

    core.setOutput('details', "I haven't done anything yet");
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;
