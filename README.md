# downstream-version-automerge

This action is intended to be triggered by a merge and find the next version branch to merge 
the combined merge into.

## Inputs

### `production-branch`

**Required** The primary branch matching the production environment. Default `"master"`.

### `development-branch`
**Required** The branch where active development is integrated into.  Default `"develop"`.

### `release-branch-pattern`
**Required** The Release Branch naming pattern. Default `"'release/*'"`.

### `merge-strategy`
**Required** The Branch merging strategy. Default `"merge-no-ff"`

### `repo-token`

## Secrets
`GITHUB_TOKEN`
Uses the GitHub Token to fetch the branches

## Environment Variables used,
`GITHUB_API_URL`


## Outputs

### `details`
Short description of the actions taken by this Action


## Example usage

```yaml
  uses: maikuru/downstream-version-automerge@v1.0.0
  - name: 
    with:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      production-branch: master
      development-branch: develop
      release-branch-pattern: release/*
      merge-strategy: merge-no-ff
```
