const core = require('@actions/core');
const GitHub = require('@actions/github');
const run = require('../src/automerge.js');

jest.mock('@actions/core');
jest.mock('@actions/github');

const branchSample = {
  data: [
    {
      name: 'develop',
      protected: false
    },
    {
      name: 'master',
      protected: false
    },
    {
      name: 'release/1.2.1-beta1',
      protected: false
    },
    {
      name: 'release/1.0.0-RC1',
      protected: false
    },
    {
      name: 'release/1.0.0',
      protected: false
    },
    {
      name: 'release/1.1.0',
      protected: false
    },
    {
      name: 'release/1.2.2',
      protected: false
    },
    {
      name: 'release/1.2',
      protected: false
    },
    {
      name: 'release/1.11.0',
      protected: false
    },
    {
      name: 'release/old_0.0.1',
      protected: false
    },
    {
      name: 'feature/abc',
      protected: false
    }
  ]
};

/* eslint-disable no-undef */
describe('Valid Branch Workflows', () => {
  let create;
  let listBranches;
  let merge;

  beforeEach(() => {
    listBranches = jest.fn().mockReturnValueOnce(branchSample);
    merge = jest.fn().mockReturnValueOnce({});
    create = jest.fn().mockReturnValueOnce({});

    GitHub.getOctokit = jest.fn().mockReturnValue({
      pulls: {
        create
      },
      repos: {
        listBranches,
        merge
      }
    });

    core.getInput = jest
      .fn()
      .mockReturnValueOnce('master')
      .mockReturnValueOnce('develop')
      .mockReturnValueOnce('release/')
      .mockReturnValueOnce('Auto Merged {source_branch} into {target_branch}')
      .mockReturnValueOnce('Failed Auto Merged {source_branch} into {target_branch}');

    GitHub.context.repo = {
      owner: 'owner',
      repo: 'repo'
    };
  });

  test('Master Branch Triggered', async () => {
    const source = 'master';
    const target = 'release/1.0.0-RC1';
    GitHub.context.ref = `refs/heads/${source}`;

    await run();

    expect(listBranches).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo'
    });
    expect(merge).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      base: target,
      head: source,
      commit_message: `Auto Merged ${source} into ${target}`
    });
    expect(create).toHaveBeenCalledTimes(0);
  });

  test('Develop Branch Triggered', async () => {
    GitHub.context.ref = 'refs/heads/develop';

    await run();

    expect(listBranches).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo'
    });
    expect(merge).toHaveBeenCalledTimes(0);
    expect(create).toHaveBeenCalledTimes(0);
  });

  test('middle Branch Triggered', async () => {
    const source = 'release/1.2.1-beta1';
    const target = 'release/1.2.2';

    GitHub.context.ref = `refs/heads/${source}`;

    await run();

    expect(listBranches).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo'
    });
    expect(merge).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      base: source,
      head: target,
      commit_message: `Auto Merged ${source} into ${target}`
    });
    expect(create).toHaveBeenCalledTimes(0);
    expect(core.setOutput).toHaveBeenCalledWith('sourceBranch', 'release/1.2.1-beta1');
  });
});

describe('Invalid Ref Received', () => {
  let listBranches;

  beforeEach(() => {
    listBranches = jest.fn().mockReturnValueOnce(branchSample);

    GitHub.context.repo = {
      owner: 'owner',
      repo: 'repo'
    };

    GitHub.getOctokit = jest.fn().mockReturnValueOnce({
      repos: {
        listBranches
      }
    });
  });

  test('triggered by tag', async () => {
    GitHub.context.ref = 'refs/tags/release/1.0.0';

    core.getInput = jest
      .fn()
      .mockReturnValueOnce('master')
      .mockReturnValueOnce('develop')
      .mockReturnValueOnce('release/')
      .mockReturnValueOnce('Auto Merged {source_branch} into {target_branch}')
      .mockReturnValueOnce('Failed Auto Merged {source_branch} into {target_branch}');

    await run();

    expect(listBranches).toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledTimes(0);
  });
});
