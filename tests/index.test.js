const core = require('@actions/core');
const GitHub = require('@actions/github');
const run = require('../src/automerge');

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
  let ghCreate;
  let ghListBranches;
  let ghMerge;

  beforeEach(() => {
    ghListBranches = jest.fn().mockReturnValue(branchSample);
    ghMerge = jest.fn().mockReturnValue({
      data: {
        commit: {
          author: {
            name: 'github-actions[bot]',
            email: '41898282+github-actions[bot]@users.noreply.github.com',
            date: '2020-12-22T16:17:48Z'
          },
          committer: {
            name: 'GitHub',
            email: 'noreply@github.com',
            date: '2020-12-22T16:17:48Z'
          },
          message: 'Auto Merged master into release/1.0.0-RC1',
          tree: {
            sha: '60ec259b2bdf199b76d00c1dc3b253a0d749b5ac',
            url: 'https://api.github.com/repos/maikuru/downstream-version-automerge/git/trees/60ec259b2bdf199b76d00c1dc3b253a0d749b5ac'
          },
          url: 'https://api.github.com/repos/maikuru/downstream-version-automerge/git/commits/20c71f4872e8d88cb0d8a5209c7a0e3df8fa5549',
          comment_count: 0
        }
      }
    });
    ghCreate = jest.fn().mockReturnValue({});

    GitHub.getOctokit = jest.fn().mockReturnValue({
      pulls: {
        create: ghCreate
      },
      repos: {
        listBranches: ghListBranches,
        merge: ghMerge
      }
    });

    core.getInput = jest
      .fn()
      .mockReturnValueOnce('master')
      .mockReturnValueOnce('develop')
      .mockReturnValueOnce('release/')
      .mockReturnValueOnce('Auto Merged {source_branch} into {target_branch}')
      .mockReturnValueOnce('yes')
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

    expect(ghListBranches).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo'
    });
    expect(ghMerge).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      base: target,
      head: source,
      commit_message: `Auto Merged ${source} into ${target}`
    });
    expect(ghMerge).toHaveBeenCalledTimes(7);
    expect(ghCreate).toHaveBeenCalledTimes(0);
  });

  test('Develop Branch Triggered', async () => {
    GitHub.context.ref = 'refs/heads/develop';

    await run();

    expect(ghListBranches).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo'
    });
    expect(ghMerge).toHaveBeenCalledTimes(0);
    expect(ghCreate).toHaveBeenCalledTimes(0);
  });

  test('Middle Branch Triggered', async () => {
    const source = 'release/1.2.1-beta1';
    const target = 'release/1.2.2';

    GitHub.context.ref = `refs/heads/${source}`;

    await run();

    expect(ghListBranches).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo'
    });
    expect(ghMerge).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      base: target,
      head: source,
      commit_message: `Auto Merged ${source} into ${target}`
    });
    expect(ghCreate).toHaveBeenCalledTimes(0);
  });
});

describe('No Develop branch', () => {
  let ghCreate;
  let ghListBranches;
  let ghMerge;

  beforeEach(() => {
    ghListBranches = jest
      .fn()
      .mockReturnValue({
        data: [
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
            name: 'release/1.11.0',
            protected: false
          },
          {
            name: 'feature/abc',
            protected: false
          }
        ]
      })
      .mockName('listBranches');
    ghMerge = jest
      .fn()
      .mockReturnValueOnce({
        data: {
          commit: {
            author: {
              name: 'github-actions[bot]',
              email: '41898282+github-actions[bot]@users.noreply.github.com',
              date: '2020-12-22T16:17:48Z'
            },
            committer: {
              name: 'GitHub',
              email: 'noreply@github.com',
              date: '2020-12-22T16:17:48Z'
            },
            message: 'Auto Merged master into release/1.0.0-RC1',
            tree: {
              sha: '60ec259b2bdf199b76d00c1dc3b253a0d749b5ac',
              url: 'https://api.github.com/repos/maikuru/downstream-version-automerge/git/trees/60ec259b2bdf199b76d00c1dc3b253a0d749b5ac'
            },
            url: 'https://api.github.com/repos/maikuru/downstream-version-automerge/git/commits/20c71f4872e8d88cb0d8a5209c7a0e3df8fa5549',
            comment_count: 0
          }
        }
      })
      .mockImplementationOnce(() => {
        throw new Error("I'm a tea pot");
      });
    ghCreate = jest.fn().mockReturnValue({ data: {} });

    GitHub.getOctokit = jest.fn().mockReturnValue({
      pulls: {
        create: ghCreate
      },
      repos: {
        listBranches: ghListBranches,
        merge: ghMerge
      }
    });

    core.getInput = jest
      .fn()
      .mockReturnValueOnce('master')
      .mockReturnValueOnce('')
      .mockReturnValueOnce('release/')
      .mockReturnValueOnce('Auto Merged {source_branch} into {target_branch}')
      .mockReturnValueOnce('yes')
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

    expect(ghListBranches).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo'
    });
    expect(ghMerge).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      base: target,
      head: source,
      commit_message: `Auto Merged ${source} into ${target}`
    });
    expect(ghMerge).toHaveBeenCalledTimes(2);
    expect(ghCreate).toHaveBeenCalledTimes(1);
  });

  test('Develop Branch Triggered', async () => {
    GitHub.context.ref = 'refs/heads/develop';

    await run();

    expect(ghListBranches).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo'
    });
    expect(ghMerge).toHaveBeenCalledTimes(0);
    expect(ghCreate).toHaveBeenCalledTimes(0);
  });

  test('Middle Branch Triggered', async () => {
    const source = 'release/1.2.1-beta1';
    const target = 'release/1.2.2';

    GitHub.context.ref = `refs/heads/${source}`;

    await run();

    expect(ghMerge).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      base: target,
      head: source,
      commit_message: `Auto Merged ${source} into ${target}`
    });
    expect(ghCreate).toHaveBeenCalledTimes(1);
  });
});

describe('Invalid Ref Received', () => {
  let ghListBranches;

  beforeEach(() => {
    ghListBranches = jest.fn().mockReturnValueOnce(branchSample);

    GitHub.context.repo = {
      owner: 'owner',
      repo: 'repo'
    };

    GitHub.getOctokit = jest.fn().mockReturnValueOnce({
      repos: {
        listBranches: ghListBranches
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
      .mockReturnValueOnce('yes')
      .mockReturnValueOnce('Failed Auto Merged {source_branch} into {target_branch}');

    await run();

    expect(ghListBranches).toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledTimes(0);
  });
});
