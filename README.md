# Downstream Version Automerge

Using [Semantic Versioning](https://semver.org/),  creates a downstream hierarchy for your branches which then allows for an automated merge chain merging commits only to branches further down in the hierarchy.

This means no more reduntant Pull Requests to merge code to your downstream branches.

### WHAT IS IT DOING! ###

Lets assume you have the following branch hierarchy:

```
master (production-branch)
|> hotfix/task-wtf-did-you-do
|> release/1.2.4
  |> bugfix/task-xyz
  |> release/1.3.0
    |> feature/task-123
    |> release/2.0.0
      |> feature/task-456
      |> develop (development-branch)
        |> project/golden-eye
```

When you merge `hotfix/task-wtf-did-you-do` into `master` whether directly or via a Pull Request, this action will then attempt to merge the resulting `master` branch into `release/1.2.4` then if successful move on to merge  `release/1.2.4` into `release/1.3.0`, then `release/1.3.0` into `release/2.0.0`, and finally `release/2.0.0` into `develop`. 

If at any point the action is unable to successfully merge the one of the branches then by default a Pull Request will be created in order for the development team to see where the merge conflict arose and resolve the issue.  Once that Pull Request has been approved and merged that merge will effectively continue the auto-merge process where it failed before.

### WHAT IT IS NOT DOING!

This action is only focusing on the production, development, and release branches.  All other branches are are ignored including branches that start with the release branch prefix, but are not Semenatic Version compatible.

This means that as far as this action is concerned only these branches are in scope:

```
master (production-branch)
release/1.2.4
release/1.3.0
release/2.0.0
develop (development-branch)
```

If you happen to have a branch that is not being picked up by this Action, then please refer to the [Node SemVer](https://www.npmjs.com/package/semver) library's documentation on what is a valid format as branches with invalid version identifiers are intentioanlly skipped. 

### WHY DO I NEED THIS?

Sometimes you're just stuck having to support development of software following a non-agile trunk based development workflow.  You might have version _1.2.3_ of your code in production on your `master` branch, version _1.3.0_ (`release/1.3.0`) being tested by your user acceptance team, and a major feature in the works that needs QA attention: _2.0.0_ (`release/2.0.0`), and just for the heck of it, you have a dumping ground branch `develop` where your team puts unscheduled bleading edge completed features.

So you have a branch heirarchy that looks like this:

```
master
  ->  release/1.3.0
    ->  release/2.0.0
      -> develop
```

Now what happens when the User Acceptance team finds an issue that needs to be addressed?  Normally you would have your team approve a Pull Request from your bugfix branch into the `release/1.3.0` branch  then create 2 more pull requests to have `release/1.3.0` merged into `release/2.0.0` and lastly from `release/2.0.0` into `develop`.  This has to be done in order and requires the development team to spent a frustrating amount of time reviewing pull requests for code they've already reviewed.



## Inputs

### `production-branch`

The primary branch matching the production environment. Default `"master"`.

### `development-branch`

The branch where active development is integrated into.  Default `"develop"`.

### `release-pattern`

The Release Branch naming pattern. Default `"'release/'"`.

### `merge-message-template`

Template to generate the commit message
Default: `'Auto Merged {source_branch} into {target_branch}'`

### `pr-on-failed-merge`

(yes/no) If a merge fails, create a pull request instead.
Default: yes

### `pr-title-template`

Template to generate a PR title from, only used when `pr-on-failed-merge` is set to `yes`
Default: `'Failed Auto Merged {source_branch} into {target_branch}'`

## Environment Variables used,

* `GITHUB_API_URL`
* `GITHUB_TOKEN`

## Outputs

### `details`

Short description of the actions taken by this Action


## Example usage

```yaml
on:
  push:
    branches:
      - master
      - 'release/**'
      - develop

jobs:
  version_auto_merge:
    runs-on: ubuntu-latest
    name: version automerge
    steps:
      - id: downstream
        uses: maikuru/downstream-version-automerge@v1
        with:
          production-branch: 'master'
          development-branch: 'develop'
          release-pattern: 'release/'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
