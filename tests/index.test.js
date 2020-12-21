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
      name: 'release/1.2.1',
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
  let listBranches;

  beforeEach(() => {
    listBranches = jest.fn().mockReturnValueOnce(branchSample);

    GitHub.getOctokit = jest.fn().mockReturnValueOnce({
      repos: {
        listBranches
      }
    });

    core.getInput = jest
      .fn()
      .mockReturnValueOnce('master')
      .mockReturnValueOnce('develop')
      .mockReturnValueOnce('release/')
      .mockReturnValueOnce('merge-no-ff')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null);

    GitHub.context.repo = {
      owner: 'owner',
      repo: 'repo',
      ref: ''
    };
  });

  test('Master Branch Triggered', async () => {
    GitHub.context.repo.ref = 'refs/heads/master';

    await run();

    expect(listBranches).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo'
    });
  });

  test('Develop Branch Triggered', async () => {
    GitHub.context.repo.ref = 'refs/heads/develop';

    await run();

    expect(listBranches).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo'
    });
  });

  test('middle Branch Triggered', async () => {
    GitHub.context.repo.ref = 'refs/heads/release/1.2.1-beta1';

    await run();

    expect(listBranches).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo'
    });
  });
});

describe('Invalid Ref Received', () => {
  let listBranches;

  beforeEach(() => {
    listBranches = jest.fn().mockReturnValueOnce(branchSample);

    GitHub.context.repo = {
      owner: 'owner',
      repo: 'repo',
      ref: 'refs/tags/release/2.0.0'
    };

    GitHub.getOctokit = jest.fn().mockReturnValueOnce({
      repos: {
        listBranches
      }
    });
  });

  test('I do things', async () => {
    core.getInput = jest
      .fn()
      .mockReturnValueOnce('master')
      .mockReturnValueOnce('develop')
      .mockReturnValueOnce('release/')
      .mockReturnValueOnce('merge-no-ff')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null);

    await run();

    expect(core.setFailed).toHaveBeenCalled();
    expect(listBranches).toHaveBeenCalledTimes(0);
  });
});
