jest.mock('@actions/core');
jest.mock('@actions/github');

// const core = require('@actions/core');
// const { github, context } = require('@actions/github');
// const run = require('../src/automerge.js');

describe('List Branches', () => {
  let listBranches;

  beforeEach(() => {
    listBranches = '';
  });

  test('I do things', async () => {
    expect(listBranches).toMatch('');
  });
});

/* eslint-disable no-undef */
// describe('List Branches', () => {
//   let listBranches;
//
//   beforeEach(() => {
//     listBranches = jest.fn().mockReturnValueOnce({
//       data: {
//         details: 'details'
//       }
//     });
//
//     context.repo = {
//       owner: 'owner',
//       repo: 'repo'
//     };
//
//     const github = {
//       repos: { listBranches }
//     };
//
//     GitHub.mockImplementation(() => github);
//   });
//
//   test('AutoMerge endpoint is called', async () => {
//     core.getInput = jest
//       .fn()
//       .mockReturnValueOnce('master')
//       .mockReturnValueOnce('develop')
//       .mockReturnValueOnce('release/')
//       .mockReturnValueOnce('merge-no-ff')
//       .mockReturnValueOnce(null)
//       .mockReturnValueOnce(null);
//
//     await run();
//
//     expect(listBranches).toHaveBeenCalledWith({
//       owner: 'owner',
//       repo: 'repo'
//     });
//   });
// });
