# downstream-version-automerge

This action is intended to be triggered by a merge and find the next version branch to merge 
the combined merge into.

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
